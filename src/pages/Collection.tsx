import { motion } from 'motion/react';
import { Monitor, Cpu, BookOpen, Music, Glasses, Layers, Disc3 } from 'lucide-react';
import ExploreArrow from '../components/ExploreArrow';

const hardware = [
  { name: "MacBook Pro 14\"", desc: "M3 Max, 64GB RAM" },
  { name: "HHKB Professional Hybrid", desc: "Type-S, Blank Keycaps" },
  { name: "Apple Studio Display", desc: "Nano-texture Glass" },
  { name: "Sony WH-1000XM5", desc: "Noise Cancelling Headphones" },
];

const software = [
  { name: "Neovim", desc: "Terminal Editor" },
  { name: "Ghostty", desc: "Terminal Emulator" },
  { name: "Raycast", desc: "System Launcher" },
  { name: "Figma", desc: "Interface Design" },
];

const books = [
  { title: "In Praise of Shadows", author: "Jun'ichirō Tanizaki", type: "Architecture / Aesthetics" },
  { title: "The Design of Everyday Things", author: "Don Norman", type: "Design / Psychology" },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", type: "Engineering" },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", type: "Psychology" },
];

const music = [
  { album: "Selected Ambient Works 85-92", artist: "Aphex Twin", year: "1992" },
  { album: "Discovery", artist: "Daft Punk", year: "2001" },
  { album: "Kind of Blue", artist: "Miles Davis", year: "1959" },
  { album: "Kida A", artist: "Radiohead", year: "2000" },
];

const inspirations = [
  { name: "Dieter Rams", desc: "Ten principles for good design." },
  { name: "Tadao Ando", desc: "Minimalism and the use of concrete." },
  { name: "Massimo Vignelli", desc: "Modernist typography and grid systems." },
];

export default function Collection() {
  return (
    <motion.div
      key="collection"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-grow flex flex-col relative overflow-hidden"
    >
      <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 pt-0 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-24 mt-12 md:mt-24 max-w-3xl">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center"
          >
            Things I Keep Coming Back To
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="font-serif text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tight"
          >
            Collection.
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="mt-12 max-w-xl font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed"
          >
            An ongoing archive of tools, literature, soundscapes, and references that shape my daily environment and creative output.
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-32 mb-32">
          {/* Uses Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col relative"
          >
            <div className="border-b border-zinc-800/80 pb-4 mb-12 flex items-end justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Exhibit 01 — Uses</h2>
              <Monitor className="w-4 h-4 text-zinc-600" strokeWidth={1} />
            </div>

            <div className="space-y-16">
              <div>
                <h3 className="font-serif italic text-xl text-zinc-300 mb-8 sticky top-24 bg-zinc-950/90 backdrop-blur-md z-10 py-2">Hardware</h3>
                <ul className="space-y-6">
                  {hardware.map((item, idx) => (
                    <li key={idx} className="group flex justify-between items-baseline border-b border-zinc-800/30 pb-4">
                      <span className="font-sans text-sm font-light text-zinc-200">{item.name}</span>
                      <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-500">{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-serif italic text-xl text-zinc-300 mb-8 sticky top-24 bg-zinc-950/90 backdrop-blur-md z-10 py-2">Software</h3>
                <ul className="space-y-6">
                  {software.map((item, idx) => (
                    <li key={idx} className="group flex justify-between items-baseline border-b border-zinc-800/30 pb-4">
                      <span className="font-sans text-sm font-light text-zinc-200">{item.name}</span>
                      <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-500">{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Library Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="flex flex-col relative"
          >
            <div className="border-b border-zinc-800/80 pb-4 mb-12 flex items-end justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Exhibit 02 — Library</h2>
              <BookOpen className="w-4 h-4 text-zinc-600" strokeWidth={1} />
            </div>

            <ul className="space-y-8">
              {books.map((book, idx) => (
                <li key={idx} className="group flex flex-col gap-2 border-b border-zinc-800/30 pb-6">
                  <div className="flex justify-between items-start">
                     <span className="font-serif text-lg md:text-xl text-zinc-200 group-hover:text-white transition-colors">{book.title}</span>
                     <span className="font-sans text-[9px] uppercase tracking-widest text-zinc-600 shrink-0 mt-1.5 ml-4">{book.type}</span>
                  </div>
                  <span className="font-sans text-xs text-zinc-500 font-light tracking-wide">{book.author}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-32 mb-32">
          {/* Audio Archive */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col relative"
          >
            <div className="border-b border-zinc-800/80 pb-4 mb-12 flex items-end justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Exhibit 03 — Audio</h2>
              <Disc3 className="w-4 h-4 text-zinc-600 animate-[spin_4s_linear_infinite]" strokeWidth={1} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {music.map((track, idx) => (
                <div key={idx} className="group cursor-pointer">
                   <div className="aspect-square bg-zinc-900 border border-zinc-800/50 mb-6 relative overflow-hidden group-hover:border-zinc-700 transition-colors">
                     <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-zinc-800/20 to-zinc-900"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-12 h-12 rounded-full border border-zinc-700/50 group-hover:scale-110 transition-transform duration-700"></div>
                     </div>
                   </div>
                   <h3 className="font-serif text-lg text-zinc-200 mb-1">{track.album}</h3>
                   <div className="flex justify-between items-center">
                     <span className="font-sans text-xs text-zinc-500 font-light">{track.artist}</span>
                     <span className="font-mono text-[9px] text-zinc-600">{track.year}</span>
                   </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Inspirations */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="flex flex-col relative"
          >
            <div className="border-b border-zinc-800/80 pb-4 mb-12 flex items-end justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-sm z-20 pt-10">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Exhibit 04 — Influences</h2>
              <Glasses className="w-4 h-4 text-zinc-600" strokeWidth={1} />
            </div>

            <div className="relative border-l border-zinc-800/50 pl-8 space-y-12 py-4">
              {inspirations.map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[37px] top-1.5 w-2 h-2 rounded-full bg-zinc-800 border border-zinc-600"></div>
                  <h3 className="font-serif text-2xl text-zinc-300 mb-2">{item.name}</h3>
                  <p className="font-sans text-sm text-zinc-500 font-light leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-16 bg-zinc-900/30 border border-zinc-800/50 p-8 flex items-start gap-6">
                <Layers className="w-5 h-5 text-zinc-600 shrink-0 mt-1" strokeWidth={1} />
                <div>
                   <span className="block font-sans text-[9px] uppercase tracking-[0.2em] text-zinc-500 mb-3">Curator's Note</span>
                   <p className="font-sans text-xs text-zinc-400 font-light leading-relaxed italic">
                     "We are generally the product of what we consume. Building a curated environment of high-quality inputs is essential for producing meaningful outputs."
                   </p>
                </div>
            </div>
          </motion.div>
        </div>

        <div className="flex justify-center mt-16 mb-24">
           <ExploreArrow label="Explore Deeper" direction="down" />
        </div>

        {/* Footer spacing */}
        <div className="h-16" />

      </div>
    </motion.div>
  );
}
