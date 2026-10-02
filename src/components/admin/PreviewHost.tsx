import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ContentModal from '../ContentModal';
import JournalCard from '../JournalCard';
import FrameCard from '../rushes/FrameCard';
import MotionPlate from '../rushes/MotionPlate';
import SafeImage from '../SafeImage';
import { RecLabel } from '../rushes';
import { getCardImageStyle, getMediaFx } from '../../lib/customization';
import { MediaFxOverlays } from '../MediaFx';
import { COLLECTION_LABEL, isDetailCollection } from '../../lib/collections';
import {
  INK_SECTION_LABELS,
  SECRET_KIND_LABELS,
  SECRET_ROOM_LABELS,
  SECRET_TRIGGER_LABELS,
  categoryLabelFor,
  destinationFor,
  STYLED_COLLECTIONS,
  type PreviewPayload,
} from './model';
import type { InkSection, JournalEntry, SecretRoomId, SecretTrigger } from '../../types';

/** Where the admin loads this from, and what it sends it. Shared with LivePreview. */
export const PREVIEW_FRAME_PATH = '/admin/preview-frame';
export const PREVIEW_MESSAGE = 'admin-preview';
export const PREVIEW_READY = 'admin-preview-ready';

/**
 * PreviewHost — the inside of the admin's live preview iframe.
 *
 * It is the real site, not a lookalike: the page view is the same
 * `ContentModal variant="page"` that `/journal/<slug>` renders, and the card
 * view uses the same `JournalCard` / `FrameCard` that the listing pages use. A
 * change to how the site draws an entry therefore changes the preview with it,
 * and the two can never drift apart again.
 *
 * Mounted from `main.tsx` on `/admin/preview-frame` in development only. The
 * admin posts it the form state whenever a field changes.
 */
export default function PreviewHost() {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data;
      if (message && message.type === PREVIEW_MESSAGE && message.payload) {
        setPayload(message.payload as PreviewPayload);
      }
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin);

    // A preview is not a place to navigate away from.
    const blockLinks = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a');
      if (anchor) event.preventDefault();
    };
    document.addEventListener('click', blockLinks, true);

    return () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('click', blockLinks, true);
    };
  }, []);

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        waiting for the editor…
      </div>
    );
  }

  const canRenderPage =
    payload.view === 'page' && STYLED_COLLECTIONS.includes(payload.collection) && isDetailCollection(payload.collection);

  return (
    <div className="min-h-screen bg-canvas text-zinc-100" data-preview-view={canRenderPage ? 'page' : 'card'}>
      {canRenderPage ? <PagePreview payload={payload} /> : <CardPreview payload={payload} />}
    </div>
  );
}

function PagePreview({ payload }: { payload: PreviewPayload }) {
  const collection = payload.collection as 'journal' | 'tech' | 'photography' | 'portfolio';
  return (
    <div className="page-shell pt-0">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-10 md:pt-16">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
          <ArrowLeft size={13} strokeWidth={1.6} />
          {COLLECTION_LABEL[collection]} index
        </span>
        <RecLabel quiet className="text-zinc-400">
          {COLLECTION_LABEL[collection]} / {payload.slug}
        </RecLabel>
      </nav>

      <article className="mt-10 md:mt-14">
        <ContentModal
          key={payload.replay}
          variant="page"
          isOpen
          forceMotion
          onClose={() => undefined}
          title={payload.title}
          category={payload.category}
          date={payload.date}
          coverImage={payload.coverImage}
          excerpt={payload.excerpt}
          body={payload.body}
          metadata={payload.metadata}
          video={payload.video}
          videoPoster={payload.videoPoster}
          customization={payload.customization}
        />
      </article>
      <div className="h-24" />
    </div>
  );
}

/** A column as wide as the listing would give it, with ghost neighbours for scale. */
function GridContext({ children, columns = 3 }: { children: React.ReactNode; columns?: 2 | 3 }) {
  const ghosts = Array.from({ length: columns - 1 });
  return (
    <div className={`grid grid-cols-1 gap-10 md:gap-6 ${columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
      <div className="min-w-0">{children}</div>
      {ghosts.map((_, index) => (
        <div key={index} className="hidden md:block" aria-hidden="true">
          <div className="hairline-grid aspect-[4/3] w-full border border-dashed border-zinc-800 bg-well opacity-60" />
          <div className="mt-4 h-2 w-2/3 bg-zinc-800" />
          <div className="mt-2 h-2 w-1/3 bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{children}</p>
  );
}

function CardPreview({ payload }: { payload: PreviewPayload }) {
  const dest = destinationFor(payload.collection);
  const cover = payload.coverImage;
  const customization = payload.customization;

  const journalEntry: JournalEntry = useMemo(
    () => ({
      title: payload.title,
      slug: payload.slug,
      date: payload.isoDate || '',
      category: payload.category as JournalEntry['category'],
      featuredImage: cover,
      coverImage: cover,
      excerpt: payload.excerpt || '',
      readingTime: payload.readingTime,
      volume: payload.volume,
      tags: payload.tags,
      body: payload.body,
      customization,
    }),
    [payload, cover, customization]
  );

  let card: React.ReactNode;

  if (payload.collection === 'journal') {
    card = (
      <div className="space-y-14">
        <div>
          <SectionLabel>Featured card — the newest entry</SectionLabel>
          <JournalCard entry={journalEntry} variant="featured" onOpen={() => undefined} />
        </div>
        <div>
          <SectionLabel>Archive card</SectionLabel>
          <div className="max-w-sm">
            <JournalCard entry={journalEntry} variant="archive" onOpen={() => undefined} />
          </div>
        </div>
      </div>
    );
  } else if (payload.collection === 'secrets') {
    card = <SecretCard payload={payload} />;
  } else if (payload.collection === 'timeline') {
    card = <TimelineCard payload={payload} />;
  } else if (payload.collection === 'home' && payload.category === 'reel') {
    card = <ReelCard payload={payload} />;
  } else if (['portfolio', 'tech', 'photography'].includes(payload.collection)) {
    card = (
      <div>
        <SectionLabel>{dest?.label} card — as it appears on {dest?.listPath}</SectionLabel>
        <GridContext>
          <FrameCard
            title={payload.title}
            image={cover}
            tag={payload.category}
            index="01"
            excerpt={payload.excerpt}
            aspect="aspect-[4/3] sm:aspect-[16/10]"
            customization={customization}
          />
        </GridContext>
      </div>
    );
  } else if (payload.collection === 'home' && payload.category === 'gateway') {
    card = (
      <div>
        <SectionLabel>Gateway plate — the “where to next” grid on the Home page</SectionLabel>
        <GridContext>
          <FrameCard
            title={payload.title}
            image={cover}
            index="01/"
            tag={payload.label?.replace(/^\d+\s*\/\/\s*/, '')}
            excerpt={payload.excerpt}
            aspect="aspect-[4/3]"
          />
        </GridContext>
      </div>
    );
  } else {
    card = <TextBlockCard payload={payload} />;
  }

  return (
    <div className="page-shell pt-0">
      <div className="pt-10 md:pt-14">
        <RecLabel quiet className="text-zinc-400">
          preview · {dest?.listPath ?? '/'}
        </RecLabel>
        <div className="mt-8">{card}</div>
      </div>
      <div className="h-24" />
    </div>
  );
}

function ReelCard({ payload }: { payload: PreviewPayload }) {
  const fx = getMediaFx(payload.customization);
  return (
    <section>
      <SectionLabel>Reel — the “frames that keep moving” section on the Home page</SectionLabel>
      {payload.video ? (
        <MotionPlate
          key={payload.replay}
          src={payload.video}
          poster={payload.videoPoster || payload.coverImage}
          title={payload.title}
          caption={payload.excerpt || payload.title}
          aspect="aspect-[16/9]"
          mediaFilter={fx.filter}
          overlay={<MediaFxOverlays fx={fx} />}
        />
      ) : (
        <div className="hairline-grid flex aspect-[16/9] w-full items-center justify-center border border-dashed border-zinc-700 bg-well font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          no clip yet — upload one to see it here
        </div>
      )}
      <div className="mt-5 flex items-baseline justify-between gap-6">
        <h3 className="font-display text-2xl font-medium tracking-[-0.035em] text-zinc-100">{payload.title}</h3>
        {payload.label && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{payload.label}</span>
        )}
      </div>
      {payload.excerpt && <p className="mt-2 max-w-xl text-sm font-light text-zinc-400">{payload.excerpt}</p>}
    </section>
  );
}

/**
 * A secret, as the hidden layer will show it.
 *
 * Deliberately not the real magic components: `src/components/magic/` does not
 * exist yet, so this draws the shape each kind has — a manuscript leaf for a
 * room or a note, the revealed copy for an easter egg, and the two-line
 * marginalia for invisible ink — from the studio's own primitives.
 */
function SecretCard({ payload }: { payload: PreviewPayload }) {
  const kind = payload.kind ?? 'note';
  const where =
    kind === 'room' || kind === 'note'
      ? SECRET_ROOM_LABELS[(payload.room || 'library') as SecretRoomId]
      : kind === 'egg'
        ? SECRET_TRIGGER_LABELS[(payload.trigger || 'seal') as SecretTrigger]
        : INK_SECTION_LABELS[(payload.section || 'hero') as InkSection];

  if (kind === 'ink') {
    return (
      <div>
        <SectionLabel>
          {SECRET_KIND_LABELS.ink} · {where}
        </SectionLabel>
        <div className="relative max-w-xl border border-dashed border-zinc-800 bg-well px-7 py-10">
          <span className="absolute left-7 top-3 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">
            under the light
          </span>
          <p
            className="font-display text-xl leading-snug tracking-[-0.02em]"
            style={{ color: 'color-mix(in oklab, var(--accent) 60%, #f4f2ed)' }}
          >
            {payload.title}
          </p>
          {payload.excerpt && <p className="mt-2 font-mono text-[11px] text-zinc-500">{payload.excerpt}</p>}
        </div>
        <p className="mt-4 max-w-xl text-[0.75rem] leading-relaxed text-zinc-500">
          Invisible until a visitor casts light over this part of the page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>
        {SECRET_KIND_LABELS[kind]} · {where}
      </SectionLabel>
      <article
        className="max-w-2xl border border-zinc-800 px-8 py-9 shadow-2xl"
        style={{ background: 'color-mix(in oklab, var(--bone, #f4f2ed) 94%, #d8cfbd)', color: '#2a2722' }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#8a7f6d' }}>
          {kind === 'egg' ? 'what it reveals' : kind === 'room' ? 'the door' : 'found on the shelf'}
        </p>
        <h3 className="mt-3 font-display text-3xl font-medium leading-tight tracking-[-0.035em]">{payload.title}</h3>
        {payload.excerpt && (
          <p className="mt-3 font-display text-base italic leading-relaxed" style={{ color: '#5c5346' }}>
            {payload.excerpt}
          </p>
        )}
        {payload.coverImage && (
          <div className="my-6 overflow-hidden border" style={{ borderColor: '#cfc4ae' }}>
            <SafeImage src={payload.coverImage} alt={payload.title} className="block w-full" />
          </div>
        )}
        {payload.body.trim() ? (
          <div className="mt-6 space-y-4 text-[0.9375rem] leading-[1.75]">
            <ReactMarkdown>{payload.body}</ReactMarkdown>
          </div>
        ) : (
          <p className="mt-6 font-mono text-[11px]" style={{ color: '#a0947f' }}>
            no body yet — this is where the manuscript goes
          </p>
        )}
      </article>
      {payload.visible === false && (
        <p className="mt-4 max-w-2xl text-[0.75rem] leading-relaxed text-amber-300">
          Switched off: {kind === 'room' ? 'this room’s door does not work' : kind === 'egg' ? 'this easter egg is disabled' : 'this note is not in its room'}.
        </p>
      )}
    </div>
  );
}

/** A timeline chapter, with its year and place. */
function TimelineCard({ payload }: { payload: PreviewPayload }) {
  return (
    <div>
      <SectionLabel>Timeline chapter — on the Home page</SectionLabel>
      <div className="max-w-2xl border-l-2 border-[var(--accent)] pl-6">
        <p className="flex flex-wrap items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          <span className="text-[var(--accent)]">{payload.year || '––––'}</span>
          {payload.place && (
            <>
              <span aria-hidden>·</span>
              <span>{payload.place}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>position {payload.order ?? 0}</span>
        </p>
        <h3 className="mt-3 font-display text-2xl font-medium leading-tight tracking-[-0.035em] text-zinc-100">
          {payload.title}
        </h3>
        {payload.excerpt && <p className="mt-3 text-sm font-light leading-relaxed text-zinc-400">{payload.excerpt}</p>}
        {payload.body.trim() && (
          <div className="mt-4 text-sm font-light leading-relaxed text-zinc-500">
            <ReactMarkdown>{payload.body}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function TextBlockCard({ payload }: { payload: PreviewPayload }) {
  const dest = destinationFor(payload.collection);
  const categoryName = categoryLabelFor(payload.collection, payload.category);
  return (
    <div>
      <SectionLabel>
        {dest?.label}
        {categoryName && payload.category !== dest?.fixedCategory ? ` · ${categoryName}` : ''}
      </SectionLabel>
      <div className="max-w-2xl border border-zinc-800 bg-canvas-raised p-8">
        {payload.coverImage && (
          <div className="image-frame mb-6 aspect-[16/10] w-full overflow-hidden">
            <SafeImage
              src={payload.coverImage}
              alt={payload.title}
              className="h-full w-full object-cover"
              style={getCardImageStyle(payload.customization)}
            />
          </div>
        )}
        {payload.label && (
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{payload.label}</p>
        )}
        <h3 className="font-display text-2xl font-medium leading-tight tracking-[-0.035em] text-zinc-100">
          {payload.title}
        </h3>
        {payload.excerpt && <p className="mt-3 text-sm font-light leading-relaxed text-zinc-400">{payload.excerpt}</p>}
      </div>
    </div>
  );
}
