import { motion } from 'motion/react';
import { ArrowRight, Github, Twitter, Linkedin, Mail } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  SOCIAL LINKS CONFIG                                                */
/*  👉 Replace each placeholder below with your real URLs.            */
/*     - Web profiles: full https URLs                                */
/*     - email:        keep the "mailto:" prefix                      */
/*     - phone:        keep the "tel:" prefix                         */
/* ------------------------------------------------------------------ */
const SOCIAL_LINKS = {
  github: "https://github.com/arbabmujtaba",                  // 👉 e.g. "https://github.com/arbabmujtaba"
  linkedin: "https://www.linkedin.com/in/arbab-mujtaba",              // 👉 e.g. "https://www.linkedin.com/in/your-handle"
  instagram: "https://www.instagram.com/arbabmujtabaaaa?igsh=MTFzOGl4MnN1dzc2dQ%3D%3D&utm_source=qr",            // 👉 e.g. "https://www.instagram.com/your-handle"
  twitter: "https://x.com/arbabmujtaba2?s=11",                // 👉 e.g. "https://x.com/your-handle"
  readcv: "https://drive.google.com/file/d/1lXNv_xrS5nXPg0JRB_uenNjZPVqQdmGk/view?usp=drivesdk",                  // 👉 e.g. "https://read.cv/your-handle"
  email: "mailto:arbabandjones@gmail.com",     // 👉 replace the email after "mailto:"
  phone: "tel:+919149829297",                 // 👉 replace the number after "tel:"
};

// Opens web profiles in a new tab; keeps mailto:/tel: in the same tab (expected behavior).
const isExternal = (url: string) => /^https?:\/\//i.test(url);

// Spreads target/rel only for external web links so mailto:/tel: behave normally.
const linkProps = (url: string) =>
  isExternal(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {};

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/70 mt-32 relative z-10 bg-[#0a0a09]/48 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">
          
          <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-between">
            <div>
              <h2 className="font-serif text-3xl md:text-5xl text-zinc-100 mb-6 tracking-tighter">
                Let's build <br className="hidden md:block" /> something.
              </h2>
              <p className="font-sans text-sm text-zinc-400 font-light leading-relaxed max-w-sm">
                Always open to discussing engineering challenges, new ideas, or photography projects.
              </p>
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-5 lg:col-start-8 flex flex-col justify-between">
            <div className="space-y-12">
              <div>
                <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] text-orange-500 mb-6">Stay Updated</h3>
                <div className="flex items-center gap-4 border-b border-zinc-700/50 pb-4 group">
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="bg-transparent border-none outline-none font-sans text-sm text-zinc-200 w-full placeholder-zinc-600 focus:ring-0"
                  />
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-500 transition-colors cursor-pointer" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Socials</h3>
                  <ul className="space-y-4">
                    {/* 👉 URL controlled by SOCIAL_LINKS.twitter */}
                    <li><a href={SOCIAL_LINKS.twitter} {...linkProps(SOCIAL_LINKS.twitter)} className="font-sans text-xs text-zinc-400 hover:text-orange-500 hover:tracking-wide transition-all duration-300">Twitter / X</a></li>
                    {/* 👉 URL controlled by SOCIAL_LINKS.linkedin */}
                    <li><a href={SOCIAL_LINKS.linkedin} {...linkProps(SOCIAL_LINKS.linkedin)} className="font-sans text-xs text-zinc-400 hover:text-orange-500 hover:tracking-wide transition-all duration-300">LinkedIn</a></li>
                    {/* 👉 URL controlled by SOCIAL_LINKS.github */}
                    <li><a href={SOCIAL_LINKS.github} {...linkProps(SOCIAL_LINKS.github)} className="font-sans text-xs text-zinc-400 hover:text-orange-500 hover:tracking-wide transition-all duration-300">GitHub</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Contact</h3>
                  <ul className="space-y-4">
                    {/* 👉 URL controlled by SOCIAL_LINKS.email (mailto:) */}
                    <li><a href={SOCIAL_LINKS.email} {...linkProps(SOCIAL_LINKS.email)} className="font-sans text-xs text-zinc-400 hover:text-orange-500 hover:tracking-wide transition-all duration-300">Email</a></li>
                    {/* 👉 URL controlled by SOCIAL_LINKS.readcv */}
                    <li><a href={SOCIAL_LINKS.readcv} {...linkProps(SOCIAL_LINKS.readcv)} className="font-sans text-xs text-zinc-400 hover:text-orange-500 hover:tracking-wide transition-all duration-300">Read.cv</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        <div className="mt-24 md:mt-32 pt-8 border-t border-zinc-900 flex justify-between items-center">
           <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-600">© 2026 Arbab Mujtaba</span>
           <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-600">All Rights Reserved</span>
        </div>
      </div>
    </footer>
  );
}
