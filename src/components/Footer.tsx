import { ArrowUpRight, FileText, Github, Instagram, Linkedin, Mail, Twitter } from 'lucide-react';
import { ImageTypeMask, RecLabel } from './rushes';
import WaxSeal from './magic/WaxSeal';

/* ------------------------------------------------------------------ */
/*  SOCIAL LINKS CONFIG                                                */
/*  Web profiles: full https URLs. email: keep the "mailto:" prefix.   */
/* ------------------------------------------------------------------ */
const SOCIAL_LINKS = {
  github: 'https://github.com/arbabmujtaba',
  linkedin: 'https://www.linkedin.com/in/arbab-mujtaba',
  instagram:
    'https://www.instagram.com/arbabmujtabaaaa?igsh=MTFzOGl4MnN1dzc2dQ%3D%3D&utm_source=qr',
  twitter: 'https://x.com/arbabmujtaba2?s=11',
  resume:
    'https://drive.google.com/file/d/1lXNv_xrS5nXPg0JRB_uenNjZPVqQdmGk/view?usp=drivesdk',
  email: 'mailto:arbabandjones@gmail.com',
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
}

/**
 * The wordmark stencil. Chosen by rendering the wordmark over every candidate:
 * two clean bands — ember sky over a black ridge — so contrast is high with
 * almost no fine detail, and it is the only frame where every letter stays
 * legible. `ImageTypeMask` loads the original as a CSS background with no
 * derivative, so its size matters (11 kB as WebP); a larger file would be fetched at full size
 * and the softness through the letterforms is the intended effect.
 */
const WORDMARK_IMAGE = '/uploads/photography/1781674009809-689730206.webp';

/**
 * Footer — the closing plate.
 *
 * Oversized wordmark with a photograph showing through it, the standing
 * invitation, icon links, and the wax seal. There is no newsletter field: the
 * site is statically hosted and nothing can receive a submission, so the
 * previous non-functional email input has been replaced with real mailto and
 * profile links.
 */
export default function Footer({ wordmarkImage = WORDMARK_IMAGE }: FooterProps) {
  return (
    <footer className="relative z-10 mt-32 w-full border-t border-zinc-800 bg-transparent">
      <div className="px-4 pt-20 md:px-12 md:pt-28 lg:px-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <RecLabel>contact</RecLabel>

          <h2 className="mt-7 font-display text-4xl font-medium leading-[0.95] tracking-[-0.05em] text-zinc-50 md:text-6xl">
            The way to
            <br />
            <span className="font-book font-normal italic tracking-[-0.02em] text-zinc-400">reach me</span>
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
                className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas-lift text-zinc-300 transition-colors duration-300 hover:bg-accent hover:text-on-accent"
              >
                <Icon size={16} strokeWidth={1.6} />
              </a>
            ))}
          </div>

          <a
            href={SOCIAL_LINKS.resume}
            {...linkProps(SOCIAL_LINKS.resume)}
            className="group mt-6 inline-flex h-14 items-center gap-3 rounded-full border border-zinc-700 bg-canvas-lift pl-5 pr-6 text-zinc-100 transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-on-accent"
          >
            <FileText size={18} strokeWidth={1.6} aria-hidden="true" />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">Résumé</span>
            <ArrowUpRight
              size={16}
              strokeWidth={1.6}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>

      <div data-surface="ink">
        <ImageTypeMask
          text="ARBAB."
          image={wordmarkImage}
          className="mt-20 md:mt-28"
        />
      </div>

      <div className="px-4 pb-10 md:px-12 lg:px-16">
        <div className="flex items-end justify-between gap-8 border-t border-zinc-800 pt-12">
          <p className="max-w-sm font-book text-3xl italic leading-[1.05] tracking-[-0.01em] text-zinc-100 md:text-4xl">
            An archive still
            <br />
            being written.
          </p>
          <WaxSeal align="end" />
        </div>
      </div>
    </footer>
  );
}
