/**
 * Everything the Editorial Hub can do, in plain words.
 *
 * One source for three surfaces (components/admin/Guide.tsx): the tip bar at
 * the bottom of each workspace, the hover cards on controls (`data-tip`), and
 * the searchable guide (press `?`). When a feature is added to the studio, its
 * line goes here — the guide is only as complete as this file.
 */

export type GuideView = 'dashboard' | 'content' | 'reel' | 'secrets' | 'live' | 'deploy';
export type EditorTab = 'content' | 'media' | 'style' | 'publish' | 'preview';
/** Where a tip applies: a workspace, an editor tab, or anywhere. */
export type TipTopic = GuideView | `editor.${EditorTab}` | 'general';

export interface GuideFeature {
  title: string;
  body: string;
}

export interface GuideSection {
  id: string;
  title: string;
  /** One line: what this place is for. */
  summary: string;
  /** Which workspace the "Go there" button opens. */
  view?: GuideView;
  features: GuideFeature[];
}

/** Hover cards for the sidebar, keyed by workspace. */
export const NAV_TIPS: Record<GuideView, string> = {
  dashboard: 'Your overview — how much is live, what still needs a look, and the latest entries. Click a card to jump to that list.',
  content: 'Every entry on the site in one list. Filter by section or standing, search, then Edit — or use ⋯ to publish, archive or delete.',
  reel: 'A three-step wizard for video: add a clip, choose where it goes (home reel, an existing entry or a new post), describe it.',
  secrets: 'The hidden layer — switch rooms, easter eggs and invisible-ink lines on or off, and write new hidden notes.',
  live: 'The real website in a frame. Click any text or image on it to edit that exact thing.',
  deploy: 'Publishing history, what is queued, and every reel with its order and whether it is the main plate.',
};

/** Hover cards for the editor's tabs. */
export const TAB_TIPS: Record<EditorTab, string> = {
  content: 'Title, address, date, priority, the card line, and the main text.',
  media: 'Cover photo, crop / focal point, extra gallery frames and an optional clip.',
  style: 'Fonts, sizes, colours, entrance animations and photo effects — stored with the entry, so what you see is what ships.',
  publish: 'Which section and URL this lands on, whether it shows on the site, its workflow label, and delete.',
  preview: 'The real page renderer showing your unsaved edits — phone, tablet or desktop.',
};

export const GUIDE: GuideSection[] = [
  {
    id: 'basics',
    title: 'The basics',
    summary: 'How saving, publishing and the live site fit together.',
    features: [
      { title: 'Save vs. Save & publish', body: 'Save writes the file on this machine only. Save & publish also commits and pushes it to GitHub, and GitHub Pages redeploys the site in a minute or two.' },
      { title: 'Nothing is lost', body: 'Unsaved work is autosaved in this browser. If you reload or close the tab, the editor offers to restore it.' },
      { title: 'Ctrl / ⌘ + S', body: 'Saves the entry you are editing, from any tab.' },
      { title: 'Live, Hidden, Draft', body: 'Live = on the site. Hidden = published but switched off. Draft = saved here, never pushed. An amber dot means it changed since it was last published.' },
      { title: 'Only on your machine', body: 'The Editorial Hub runs with npm run dev. The deployed site has no admin — editing always happens here, and publishing sends it out.' },
      { title: 'Press ? anywhere', body: 'Opens this guide. Rest the pointer on a button, tab or tag for a moment to see what it does; switch hover cards and the tip bar off with Tips in the sidebar.' },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    view: 'dashboard',
    summary: NAV_TIPS.dashboard,
    features: [
      { title: 'Status cards', body: 'Counts of what is live, switched off and waiting. Each card opens the content list already filtered to it.' },
      { title: 'Needs a look', body: 'Drafts and entries in review — the things that are saved but not on the site yet.' },
      { title: 'Start something', body: 'Shortcuts that open the editor on a new entry of that kind.' },
    ],
  },
  {
    id: 'content',
    title: 'Content list',
    view: 'content',
    summary: NAV_TIPS.content,
    features: [
      { title: 'Section tabs', body: 'Show only one part of the site — Journal, Photography, Work, Tech, Home page, Hidden layer — or everything.' },
      { title: 'Standing filter', body: 'Live, Hidden, Draft, Review or Archived. The numbers are how many of each.' },
      { title: 'Search', body: 'Matches title, address (slug), category and type.' },
      { title: 'Row tags', body: '★ featured = priority 0, P1 / P2… = its priority, clip = it has a video, front matter = the file has an error to fix.' },
      { title: 'The ⋯ menu', body: 'Open on the site, publish just this entry, mark it for review, move it back to draft, archive or delete it.' },
    ],
  },
  {
    id: 'editor',
    title: 'Writing an entry',
    summary: 'The editor: five tabs on the left, the real page on the right.',
    features: [
      { title: 'Content tab', body: TAB_TIPS.content },
      { title: 'Priority', body: '0 · Featured puts the entry first on the Home page and at the top of its own page. 1, 2… come right after, in order. None = by date, after everything with a priority. Two at the same number: the newer one first.' },
      { title: 'Where it lands', body: 'Above the live preview (or under Priority on smaller screens): the priority the entry holds, its rank in the section, and every slot that gives it — Home desk, Home frames, lead plate, “#3 in Travel stories” — updated as you edit. The Live editor shows the same when you click an entry on the page.' },
      { title: 'Address (slug)', body: 'The end of the URL, filled from the title. Change it before publishing — a changed address breaks old links.' },
      { title: 'Media tab', body: 'Upload a cover (any photo, even HEIC — it becomes WebP automatically). Pick a shape and drag the window and focal point; "Apply crop" bakes a new cropped file.' },
      { title: 'Gallery & clip', body: 'Photography entries take extra frames (hover to reorder or remove). Any entry can carry a short muted clip with a poster frame.' },
      { title: 'Style tab', body: '29 fonts, sizes, spacing, colours, the page background, entrance animations and photo effects (grades, grain, vignette). "Starting looks" fill the whole panel at once.' },
      { title: 'Where & publish tab', body: 'Shows the exact section and URL, lets you move the entry to another section or category, switch it off, change its workflow label, or delete it.' },
      { title: 'Live preview', body: 'The same renderer visitors get. Switch phone / tablet / desktop, "page" vs "in the list", and replay the entrance animation.' },
    ],
  },
  {
    id: 'home',
    title: 'The Home page',
    summary: 'Home blocks: Content → Home page section, or New entry → Home block.',
    view: 'content',
    features: [
      { title: 'Hero photo', body: 'The photograph behind your name. Change it in the "Hero photo" block → Media; drag the focal point to what must stay in view. Darker frames keep the name readable.' },
      { title: 'Archive doors', body: 'The four ways into the site, with their photo, line and the page they open.' },
      { title: 'Notes & thoughts', body: 'Notes turn over in "Loose leaves"; thoughts are drawn at random for the thought drawer.' },
      { title: 'Profile', body: 'The line under your name and the "Ways into the archive" paragraph.' },
      { title: 'Order & visible', body: 'Lower order comes first; the visible switch takes a block off the page without deleting it.' },
      { title: 'Timeline chapters', body: 'A year, a place and a few lines. The place (Sopore, Indore…) drives the memory map.' },
    ],
  },
  {
    id: 'reel',
    title: 'Publish a reel',
    view: 'reel',
    summary: NAV_TIPS.reel,
    features: [
      { title: 'Clip', body: 'MP4 or WebM, up to 40 MB. A poster frame is picked for you — or scrub to any moment and use that.' },
      { title: 'Destination', body: 'Home page reel ("Frames that keep moving"), attach to an existing entry, or start a new post with the clip already in it.' },
      { title: 'Main plate', body: 'On Home, the live reel with the lowest order plays large; the others wait in the strip below.' },
      { title: 'Save only', body: 'Keeps it as a local draft. Save & publish sends it to the site.' },
    ],
  },
  {
    id: 'secrets',
    title: 'Secrets (the hidden layer)',
    view: 'secrets',
    summary: NAV_TIPS.secrets,
    features: [
      { title: 'Switches', body: 'Turn each room, easter egg and ink line on or off. Off is the only way to keep it off the site.' },
      { title: 'New hidden note', body: 'Opens the editor on a new note, room, egg or ink line of the kind you pick.' },
      { title: 'Hidden is not private', body: 'Everything here ships in the public bundle — a curious visitor can read it in devtools without finding the door.' },
    ],
  },
  {
    id: 'live',
    title: 'Live editor',
    view: 'live',
    summary: NAV_TIPS.live,
    features: [
      { title: 'Click to edit', body: 'Click a title, line or photo on the page; the panel opens that field of that entry.' },
      { title: 'Devices', body: 'Desktop, tablet and phone widths, to check a change everywhere.' },
      { title: 'Open in full editor', body: 'Jumps to the full editor for the entry you clicked.' },
    ],
  },
  {
    id: 'deploy',
    title: 'Deployments',
    view: 'deploy',
    summary: NAV_TIPS.deploy,
    features: [
      { title: 'Queue & history', body: 'Every publish and where it stands — pending, building, published or failed — with a link to view it on the site.' },
      { title: 'Reels', body: 'Each reel with its poster, order and standing, and whether it is the main plate or in the strip.' },
      { title: 'Images are safe', body: 'Publishing waits for image versions to be made and pushes them with the photo — a broken image cannot reach the site.' },
    ],
  },
];

/** The short tips the tip bar rotates through. */
export const TIPS: Record<TipTopic, string[]> = {
  general: [
    'Press ? to see everything the Editorial Hub can do.',
    'Hover a button or a tab for a moment to see what it does.',
    'Save keeps changes on this machine; Save & publish puts them on the live site.',
  ],
  dashboard: [
    'Click any status card to open the list already filtered to it.',
    '"Needs a look" is everything saved but not yet on the site.',
    'Publish a reel (sidebar) is the quickest way to put a video on the Home page.',
  ],
  content: [
    'Want something at the top of the Home page? Open it and set Priority to 0 · Featured.',
    '★ featured and P1 / P2 on a row show its priority.',
    'An amber dot beside Live means the entry changed since it was last published.',
    'The ⋯ menu publishes a single entry without opening it.',
    'Home page section → "Hero photo" changes the picture behind your name.',
  ],
  reel: [
    'The live reel with the lowest order plays as the big plate on Home.',
    'Scrub the clip and pick a poster frame — it shows before the video loads.',
    '"Add to an existing entry" puts the clip inside a post you already have.',
  ],
  secrets: [
    'Switching a secret off is the only way to keep it off the site — hidden is not private.',
    'Ink lines are only readable on the site under the wand’s light (Lumos).',
  ],
  live: [
    'Click any text or photo on the page to edit exactly that.',
    'Check phone width before publishing — most visitors are on one.',
  ],
  deploy: [
    'Published entries have a “View on site” link to check the live page.',
    'Pushing to main redeploys the site; it is usually live within two minutes.',
  ],
  'editor.content': [
    'Priority 0 · Featured = first on the Home page and at the top of its section.',
    'The address (slug) is the URL. Changing it after publishing breaks old links.',
    'The excerpt is the line on cards and in search — one good sentence is enough.',
    '“Where it lands” above the preview shows exactly which slot this entry gets before you publish.',
    'Ctrl / ⌘ + S saves from anywhere in the editor.',
  ],
  'editor.media': [
    'Drag the focal point to the subject — cards and the page keep it in frame.',
    'Any photo works, even HEIC: uploads become WebP with smaller versions made for you.',
    '"Apply crop" saves the cropped frame as a new file; the original stays.',
  ],
  'editor.style': [
    '"Starting looks" set the whole panel at once — a quick way to begin.',
    'Effects apply to photographs and video alike.',
    'Use replay in the preview to watch the entrance animation again.',
  ],
  'editor.publish': [
    'Switching visibility off keeps the entry but takes it off the site.',
    'Moving an entry to another section changes its URL.',
  ],
  'editor.preview': [
    'This is the real page renderer — what you see is what visitors get.',
    'Switch to "in the list" to see the card as it appears on its page.',
  ],
};

/** A case- and accent-insensitive match over a section and its features. */
export function searchGuide(query: string, sections: GuideSection[] = GUIDE): GuideSection[] {
  const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return sections;
  const hit = (text: string) => words.every((w) => fold(text).includes(w));
  return sections
    .map((section) => {
      if (hit(`${section.title} ${section.summary}`)) return section;
      const features = section.features.filter((f) => hit(`${f.title} ${f.body}`));
      return features.length ? { ...section, features } : null;
    })
    .filter((s): s is GuideSection => s !== null);
}
