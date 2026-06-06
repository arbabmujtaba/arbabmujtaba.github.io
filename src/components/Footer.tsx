import { motion } from 'motion/react';
import { ArrowRight, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/80 mt-32 relative z-10 bg-[#0a0a09]">
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
                    <li><a href="#" className="font-sans text-xs text-zinc-400 hover:text-orange-500 hover:tracking-wide transition-all duration-300">Twitter / X</a></li>
                    <li><a href="#" className="font-sans text-xs text-zinc-400 hover:text-orange-500 hover:tracking-wide transition-all duration-300">LinkedIn</a></li>
                    <li><a href="#" className="font-sans text-xs text-zinc-400 hover:text-orange-500 hover:tracking-wide transition-all duration-300">GitHub</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Contact</h3>
                  <ul className="space-y-4">
                    <li><a href="#" className="font-sans text-xs text-zinc-400 hover:text-orange-500 hover:tracking-wide transition-all duration-300">Email</a></li>
                    <li><a href="#" className="font-sans text-xs text-zinc-400 hover:text-orange-500 hover:tracking-wide transition-all duration-300">Read.cv</a></li>
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
