import { motion, useReducedMotion } from 'motion/react';
import AppLink from '../components/AppLink';
import Footer from '../components/Footer';
import { RecLabel } from '../components/rushes';
import { COLLECTION_LABEL, DETAIL_COLLECTIONS } from '../lib/collections';
import { useMediaQuery } from '../lib/useMediaQuery';

const EASE = [0.16, 1, 0.3, 1] as const;

interface NotFoundProps {
  setView?: (view: string) => void;
  /** The path that failed to resolve, shown as instrumentation. */
  requestedPath?: string;
}

/**
 * NotFound — the view for a path that resolves to nothing.
 *
 * Reached two ways: an unknown in-site path, and GitHub Pages serving
 * `404.html` for a URL that has no pre-rendered shell. Both cases want the same
 * thing — say what was asked for, then offer the section index rather than a
 * dead end.
 */
export default function NotFound({ setView, requestedPath }: NotFoundProps) {
  const shouldReduceMotion = useReducedMotion();
  const isTouchDevice = useMediaQuery('(pointer: coarse), (max-width: 767px)');
  const flatten = shouldReduceMotion || isTouchDevice;

  const path =
    requestedPath ??
    (typeof window !== 'undefined' ? window.location.pathname : '/');

  return (
    <motion.div
      key="notFound"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: flatten ? 0.25 : 0.8, ease: EASE }}
      className="relative flex flex-grow flex-col overflow-hidden"
    >
      <div className="page-shell custom-scrollbar relative z-10 flex-grow overflow-y-auto pt-0">
        <div className="page-intro" data-mark="404">
          <RecLabel>no signal</RecLabel>

          <h1 className="page-title mt-6">
            nothing
            <br />
            <span className="text-zinc-400">recorded here</span>
          </h1>

          <p className="page-description">
            This address does not exist in the archive. It may have been renamed,
            or it may never have been written.
          </p>

          <p className="mt-6 font-mono text-[11px] tracking-[0.12em] text-zinc-400">
            requested: <span className="text-zinc-400">{path}</span>
          </p>
        </div>

        <div className="content-rule pt-10">
          <RecLabel quiet className="text-zinc-400">
            sections
          </RecLabel>

          <ul className="mt-8 flex flex-col">
            <li>
              <AppLink
                to="/"
                className="group/item flex w-full items-baseline gap-5 border-b border-zinc-800 py-6"
              >
                <span className="w-7 shrink-0 font-mono text-[11px] text-zinc-500 transition-colors group-hover/item:text-accent">
                  00
                </span>
                <span className="font-display text-2xl font-medium lowercase tracking-[-0.04em] text-zinc-500 transition-colors duration-500 group-hover/item:text-zinc-50 md:text-4xl">
                  home
                </span>
              </AppLink>
            </li>

            {DETAIL_COLLECTIONS.map((collection, index) => (
              <li key={collection}>
                <AppLink
                  to={`/${collection}`}
                  className="group/item flex w-full items-baseline gap-5 border-b border-zinc-800 py-6"
                >
                  <span className="w-7 shrink-0 font-mono text-[11px] text-zinc-500 transition-colors group-hover/item:text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-2xl font-medium lowercase tracking-[-0.04em] text-zinc-500 transition-colors duration-500 group-hover/item:text-zinc-50 md:text-4xl">
                    {COLLECTION_LABEL[collection]}
                  </span>
                </AppLink>
              </li>
            ))}
          </ul>
        </div>

        <Footer setView={setView} />
      </div>
    </motion.div>
  );
}
