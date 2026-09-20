import { Github, Instagram, Linkedin, Mail, Twitter } from 'lucide-react';
import { ImageTypeMask, RecLabel } from './rushes';

/* ------------------------------------------------------------------ */
/*  SOCIAL LINKS CONFIG                                                */
/*  Web profiles: full https URLs.                                     */
/*  email: keep the "mailto:" prefix. phone: keep the "tel:" prefix.   */
/* ------------------------------------------------------------------ */
const SOCIAL_LINKS = {
  github: 'https://github.com/arbabmujtaba',
  linkedin: 'https://www.linkedin.com/in/arbab-mujtaba',
  instagram:
    'https://www.instagram.com/arbabmujtabaaaa?igsh=MTFzOGl4MnN1dzc2dQ%3D%3D&utm_source=qr',
  twitter: 'https://x.com/arbabmujtaba2?s=11',
  readcv:
    'https://drive.google.com/file/d/1lXNv_xrS5nXPg0JRB_uenNjZPVqQdmGk/view?usp=drivesdk',
  email: 'mailto:arbabandjones@gmail.com',
  phone: 'tel:+919149829297',
};

const isExternal = (url: string) => /^https?:\/\//i.test(url);
const linkProps = (url: string) =>
  isExternal(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {};

const ICON_LINKS = [
  { href: SOCIAL_LINKS.email, label: 'Email', Icon: Mail },
  { href: SOCIAL_LINKS.github, label: 'GitHub', Icon: Github },
  { href: SOCIAL_LINKS.instagram, label: 'Instagram', Icon: Instagram },
  { href: SOCIAL_LINKS.twitter, label: 'Twitter', Icon: Twitter },
  { href: SOCIAL_LINKS.linkedin, label: 'LinkedIn', Icon: Linkedin },
];

interface FooterProps {
  /**
   * Photograph revealed through the wordmark. Defaults to the frame assigned in
   * `.kiro/IMAGE_MAP.md`, so every page gets the same closing plate rather than
   * only the one page that happened to pass a prop.
   */
  wordmarkImage?: string;
  setView?: (view: string) => void;
}

/**
 * The wordmark stencil. Chosen by rendering the wordmark over every candidate:
 * two clean bands — ember sky over a black ridge — so contrast is high with
 * almost no fine detail, and it is the only frame where every letter stays
 * legible. `ImageTypeMask` loads the original as a CSS background with no
 * derivative, so its 33 kB matters; a larger file would be fetched at full size
 * and the softness through the letterforms is the intended effect.
 */
const WORDMARK_IMAGE = '/uploads/photography/1781674009809-689730206.jpeg';

const SECTIONS = [
  { id: 'portfolio', label: 'Work' },
  { id: 'journal', label: 'Journal' },
  { id: 'tech', label: 'Logs' },
  { id: 'photography', label: 'Frames' },
  { id: 'collection', label: 'Index' },
];

/**
 * Footer — the closing plate.
 *
 * Oversized wordmark with a photograph showing through it, the standing
 * invitation, icon links, and a section index. There is no newsletter field: the
 * site is statically hosted and nothing can receive a submission, so the
 * previous non-functional email input has been replaced with real mailto and
 * profile links.
 */
export default function Footer({ wordmarkImage = WORDMARK_IMAGE, setView }: FooterProps) {
  return (
    <footer className="relative z-10 mt-32 w-full border-t border-zinc-800 bg-canvas/60 backdrop-blur-sm">
      <div className="px-4 pt-20 md:px-12 md:pt-28 lg:px-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <RecLabel>contact</RecLabel>

          <h2 className="mt-7 font-display text-4xl font-medium lowercase leading-[0.95] tracking-[-0.05em] text-zinc-50 md:text-6xl">
            the way to
            <br />
            <span className="text-zinc-400">reach me</span>
          </h2>

          <p className="mt-7 max-w-md text-sm font-light leading-relaxed text-zinc-400">
            Open to engineering work, photo commissions, and any conversation
            that starts with a stubborn question.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {ICON_LINKS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                {...linkProps(href)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas-lift text-zinc-300 transition-colors duration-300 hover:bg-accent hover:text-canvas"
              >
                <Icon size={16} strokeWidth={1.6} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <ImageTypeMask
        text="ARBAB."
        image={wordmarkImage}
        className="mt-20 md:mt-28"
      />

      <div className="px-4 pb-10 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 gap-12 border-t border-zinc-800 pt-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="max-w-sm font-display text-2xl font-medium lowercase leading-[1.1] tracking-[-0.04em] text-zinc-100 md:text-3xl">
              an archive still
              <br />
              being written.
            </p>

            <div className="mt-10 space-y-1.5 font-mono text-[10px] lowercase tracking-[0.08em] text-zinc-600">
              <p>© {new Date().getFullYear()} arbab mujtaba. all rights reserved.</p>
              <p>computer engineering, iet davv — srinagar &amp; indore.</p>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-8 md:col-span-6 md:justify-items-end">
            <div>
              <h3 className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                Sections
              </h3>
              <ul className="space-y-3.5">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => setView?.(section.id)}
                      className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:text-accent"
                    >
                      {section.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                Elsewhere
              </h3>
              <ul className="space-y-3.5">
                <li>
                  <a
                    href={SOCIAL_LINKS.readcv}
                    {...linkProps(SOCIAL_LINKS.readcv)}
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:text-accent"
                  >
                    Résumé
                  </a>
                </li>
                <li>
                  <a
                    href={SOCIAL_LINKS.email}
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:text-accent"
                  >
                    Email
                  </a>
                </li>
                <li>
                  <a
                    href={SOCIAL_LINKS.phone}
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:text-accent"
                  >
                    Phone
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>
    </footer>
  );
}
