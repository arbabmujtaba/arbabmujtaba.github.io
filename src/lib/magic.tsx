/**
 * The hidden layer's state — wand, day/night, sound, Lumos, discoveries, rooms.
 *
 * Lives in the initial chunk because the header controls need it on first
 * paint, so it carries no content: the secrets, the rooms and the effects are
 * all lazy (see components/magic). Everything a visitor chooses is remembered in
 * localStorage; nothing leaves the browser.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SecretRoomId } from '../types';

export type ThemePref = 'auto' | 'day' | 'night';
export type Theme = 'day' | 'night';

/** The seven things a visitor can find. Order is the order of the ledger. */
export const COLLECTIBLES = [
  { id: 'lantern', name: 'The lantern', hint: 'Light the margins.', where: 'Cast Lumos with the wand' },
  { id: 'key', name: 'The key', hint: 'One book on the shelf behind the desk is not like the others.', where: 'Opened the Restricted Section' },
  { id: 'lens', name: 'The lens', hint: 'Every frame section has a red light. One of them is a safelight.', where: 'Developed a print in the darkroom' },
  { id: 'star', name: 'The seventh star', hint: 'After dark, the sky above the name is not empty.', where: 'Connected the Saptarishi' },
  { id: 'seal', name: 'The wax seal', hint: 'Knock at the very end of the page. Keep knocking.', where: 'Broke the seal' },
  { id: 'compass', name: 'The compass', hint: 'Walk from one city to the other.', where: 'Traced Sopore to Indore' },
  { id: 'quill', name: 'The quill', hint: 'Read a journal volume to its last line.', where: 'Finished a volume' },
] as const;

export type CollectibleId = (typeof COLLECTIBLES)[number]['id'];

/**
 * The rooms are a lazy chunk. Fetching it only when a door is pulled put a
 * network round-trip between the pull and the room, so MagicLayer warms it on
 * idle and anything that leads to a door (the odd book, the tally light) can
 * warm it on hover or touch. One promise, so it is only ever fetched once.
 */
let roomsChunk: Promise<typeof import('../components/magic/Rooms')> | null = null;
export function prefetchRooms() {
  roomsChunk ??= import('../components/magic/Rooms').catch((error) => {
    roomsChunk = null;
    throw error;
  });
  return roomsChunk;
}

export interface Whisper {
  id: number;
  title: string;
  body?: string;
  /** Glyph id from components/magic/Glyph. */
  glyph?: string;
  /** One button in the whisper — e.g. "pick up the wand" for whoever cannot find it. */
  action?: { label: string; run: () => void };
}

interface MagicContextValue {
  wand: boolean;
  setWand: (on: boolean) => void;
  themePref: ThemePref;
  theme: Theme;
  setThemePref: (pref: ThemePref) => void;
  sound: boolean;
  setSound: (on: boolean) => void;
  lumos: boolean;
  setLumos: (on: boolean) => void;
  found: CollectibleId[];
  collect: (id: CollectibleId) => void;
  room: SecretRoomId | null;
  openRoom: (room: SecretRoomId) => void;
  closeRoom: () => void;
  ledgerOpen: boolean;
  setLedgerOpen: (open: boolean) => void;
  whisper: Whisper | null;
  whisperOf: (title: string, body?: string, glyph?: string, action?: Whisper['action']) => void;
  dismissWhisper: () => void;
  forgetEverything: () => void;
}

const MagicContext = createContext<MagicContextValue | null>(null);

const KEYS = {
  theme: 'archive.theme',
  sound: 'archive.sound',
  found: 'archive.found.v1',
};

/** Set the first time the wand is picked up; until then the header wand wears a gilt dot. */
export const WAND_TOUCHED = 'archive.wand.v1';
/** Set once the first-visit invitation has been shown. */
export const INVITED = 'archive.invited.v1';
/** `beckon` asks the header wand to draw attention to itself once; `touched` clears its dot. */
export const WAND_EVENT = 'archive:wand';

export function readFlag(key: string) {
  return read(key) === '1';
}
export function writeFlag(key: string) {
  write(key, '1');
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode — choices just don't persist */
  }
}

/** Day from six in the morning to six in the evening, local time. Mirrors index.html. */
export function resolveTheme(pref: ThemePref, now = new Date()): Theme {
  if (pref === 'day' || pref === 'night') return pref;
  const hour = now.getHours();
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

/** Milliseconds until the clock next crosses 06:00 or 18:00. */
function msUntilNextBoundary(now = new Date()): number {
  const next = new Date(now);
  const hour = now.getHours();
  next.setMinutes(0, 0, 0);
  if (hour < 6) next.setHours(6);
  else if (hour < 18) next.setHours(18);
  else {
    next.setDate(next.getDate() + 1);
    next.setHours(6);
  }
  return Math.max(1000, next.getTime() - now.getTime());
}

/** Fire-and-forget sound cue; the engine is loaded only once sound is on. */
export function cue(name: 'chime' | 'door' | 'spark') {
  window.dispatchEvent(new CustomEvent('archive:cue', { detail: name }));
}

export function MagicProvider({ children }: { children: ReactNode }) {
  const [wand, setWandState] = useState(false);
  const [themePref, setThemePrefState] = useState<ThemePref>(() => {
    const stored = read(KEYS.theme);
    return stored === 'day' || stored === 'night' || stored === 'auto' ? stored : 'night';
  });
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(themePref));
  const [sound, setSoundState] = useState(() => read(KEYS.sound) === 'on');
  const [lumos, setLumosState] = useState(false);
  const [found, setFound] = useState<CollectibleId[]>(() => {
    try {
      const parsed = JSON.parse(read(KEYS.found) || '[]');
      const known = new Set<string>(COLLECTIBLES.map((c) => c.id));
      return Array.isArray(parsed) ? parsed.filter((id): id is CollectibleId => known.has(id)) : [];
    } catch {
      return [];
    }
  });
  const [room, setRoom] = useState<SecretRoomId | null>(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [whisper, setWhisper] = useState<Whisper | null>(null);
  const whisperId = useRef(0);

  // ---- theme: resolve, apply to <html>, follow the clock when on auto ----
  useEffect(() => {
    setTheme(resolveTheme(themePref));
    if (themePref !== 'auto') return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setTheme(resolveTheme('auto'));
        schedule();
      }, msUntilNextBoundary());
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [themePref]);

  useEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute('data-theme') === theme) return;
    root.classList.add('theme-fade');
    root.setAttribute('data-theme', theme);
    const timer = window.setTimeout(() => root.classList.remove('theme-fade'), 700);
    return () => window.clearTimeout(timer);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-wand', wand ? 'on' : 'off');
  }, [wand]);

  useEffect(() => {
    document.documentElement.setAttribute('data-lumos', lumos ? 'on' : 'off');
  }, [lumos]);

  // Coarse pointers get a different Lumos (no light to carry around).
  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)');
    const apply = () => document.documentElement.setAttribute('data-pointer', query.matches ? 'coarse' : 'fine');
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  const setThemePref = useCallback((pref: ThemePref) => {
    write(KEYS.theme, pref === 'auto' ? null : pref);
    setThemePrefState(pref);
  }, []);

  const setSound = useCallback((on: boolean) => {
    write(KEYS.sound, on ? 'on' : null);
    setSoundState(on);
  }, []);

  const setWand = useCallback((on: boolean) => {
    setWandState(on);
    if (!on) setLumosState(false);
    if (on && read(WAND_TOUCHED) !== '1') {
      write(WAND_TOUCHED, '1');
      window.dispatchEvent(new CustomEvent(WAND_EVENT, { detail: 'touched' }));
    }
  }, []);

  const setLumos = useCallback((on: boolean) => setLumosState(on), []);

  const whisperOf = useCallback((title: string, body?: string, glyph?: string, action?: Whisper['action']) => {
    whisperId.current += 1;
    setWhisper({ id: whisperId.current, title, body, glyph, action });
  }, []);

  const dismissWhisper = useCallback(() => setWhisper(null), []);

  const collect = useCallback((id: CollectibleId) => {
    setFound((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      write(KEYS.found, JSON.stringify(next));
      // The whisper and the chime are raised by MagicLayer, which knows which
      // collectibles the author has switched on.
      queueMicrotask(() => window.dispatchEvent(new CustomEvent('archive:found', { detail: id })));
      return next;
    });
  }, []);

  const openRoom = useCallback((next: SecretRoomId) => {
    setLedgerOpen(false);
    setRoom(next);
    cue('door');
  }, []);
  const closeRoom = useCallback(() => setRoom(null), []);

  const forgetEverything = useCallback(() => {
    write(KEYS.found, null);
    setFound([]);
    setWhisper(null);
  }, []);

  const value = useMemo<MagicContextValue>(
    () => ({
      wand,
      setWand,
      themePref,
      theme,
      setThemePref,
      sound,
      setSound,
      lumos,
      setLumos,
      found,
      collect,
      room,
      openRoom,
      closeRoom,
      ledgerOpen,
      setLedgerOpen,
      whisper,
      whisperOf,
      dismissWhisper,
      forgetEverything,
    }),
    [wand, setWand, themePref, theme, setThemePref, sound, setSound, lumos, setLumos, found, collect, room, openRoom, closeRoom, ledgerOpen, whisper, whisperOf, dismissWhisper, forgetEverything]
  );

  return <MagicContext.Provider value={value}>{children}</MagicContext.Provider>;
}

/** Inert fallback so a component rendered outside the provider (admin preview) never crashes. */
const NOOP: MagicContextValue = {
  wand: false,
  setWand: () => {},
  themePref: 'night',
  theme: 'night',
  setThemePref: () => {},
  sound: false,
  setSound: () => {},
  lumos: false,
  setLumos: () => {},
  found: [],
  collect: () => {},
  room: null,
  openRoom: () => {},
  closeRoom: () => {},
  ledgerOpen: false,
  setLedgerOpen: () => {},
  whisper: null,
  whisperOf: () => {},
  dismissWhisper: () => {},
  forgetEverything: () => {},
};

export function useMagic(): MagicContextValue {
  return useContext(MagicContext) ?? NOOP;
}

/** Element-level event bus for spells that affect many objects at once. */
export const SPELL_EVENT = 'archive:spell';
export type Spell = 'leviosa' | 'lumos' | 'nox' | 'alohomora';
export function castSpell(spell: Spell, detail?: { x: number; y: number }) {
  window.dispatchEvent(new CustomEvent(SPELL_EVENT, { detail: { spell, ...detail } }));
}
