/**
 * The hidden layer's content — `content/secrets/*.md`.
 *
 * Kept out of `cms.ts` on purpose: `cms.ts` is pulled into every page chunk,
 * and nothing in here should load until a visitor actually opens a door. This
 * module is only imported from lazily-loaded magic components.
 *
 * Hidden is not private. Everything published here is bundled into the public
 * site, exactly like the rest of `content/`; a determined visitor can read it in
 * the network panel. The admin says so next to every secret.
 */

import { parseMarkdown } from './frontmatter';
import {
  INK_SECTIONS,
  SECRET_KINDS,
  SECRET_ROOMS,
  SECRET_TRIGGERS,
  type InkSection,
  type SecretEntry,
  type SecretKind,
  type SecretRoomId,
  type SecretTrigger,
} from '../types';

const secretsGlob = (import.meta as any).glob('/content/secrets/**/*.md', { query: '?raw', eager: true });

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

let cache: SecretEntry[] | null = null;

/** Every secret, visible or not, in authoring order. */
export function getAllSecrets(): SecretEntry[] {
  if (cache) return cache;
  cache = Object.entries(secretsGlob)
    .map(([filePath, module]: [string, any]) => {
      const { data, content } = parseMarkdown(module.default);
      const kind = pick<SecretKind>(data.kind, SECRET_KINDS) ?? 'note';
      return {
        title: data.title || 'Untitled',
        slug: data.slug || filePath.split('/').pop()?.replace('.md', '') || '',
        kind,
        room: pick<SecretRoomId>(data.room, SECRET_ROOMS),
        trigger: pick<SecretTrigger>(data.trigger, SECRET_TRIGGERS),
        section: pick<InkSection>(data.section, INK_SECTIONS),
        description: data.description || '',
        date: data.date ? String(data.date) : undefined,
        image: data.image || undefined,
        order: typeof data.order === 'number' ? data.order : 0,
        visible: data.visible !== false,
        body: content || '',
      } satisfies SecretEntry;
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return cache;
}

export function getVisibleSecrets(): SecretEntry[] {
  return getAllSecrets().filter((secret) => secret.visible);
}

/** A room's configuration entry, if the author wrote one. */
export function getRoomConfig(room: SecretRoomId): SecretEntry | undefined {
  return getAllSecrets().find((secret) => secret.kind === 'room' && secret.room === room);
}

/** A room is open unless its configuration entry says `visible: false`. */
export function isRoomEnabled(room: SecretRoomId): boolean {
  const config = getRoomConfig(room);
  return config ? config.visible : true;
}

/** Notes filed in one room. */
export function getRoomNotes(room: SecretRoomId): SecretEntry[] {
  return getVisibleSecrets().filter((secret) => secret.kind === 'note' && secret.room === room);
}

/** The copy for one easter egg, or undefined when the author switched it off. */
export function getEgg(trigger: SecretTrigger): SecretEntry | undefined {
  return getVisibleSecrets().find((secret) => secret.kind === 'egg' && secret.trigger === trigger);
}

/**
 * Whether an easter egg is switched on. An egg with no entry at all is on (it
 * falls back to built-in copy); an egg whose entry is hidden is off.
 */
export function isEggEnabled(trigger: SecretTrigger): boolean {
  const entry = getAllSecrets().find((secret) => secret.kind === 'egg' && secret.trigger === trigger);
  return entry ? entry.visible : true;
}

/** Invisible-ink marginalia for one section. */
export function getInk(section: InkSection): SecretEntry[] {
  return getVisibleSecrets().filter((secret) => secret.kind === 'ink' && secret.section === section);
}
