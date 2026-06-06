import { motion } from 'motion/react';
import { Camera, Aperture, Focus } from 'lucide-react';
import ExploreArrow from '../components/ExploreArrow';
import ParallaxImage from '../components/ParallaxImage';

const favorites = [

  {
    title: "The First Snow",
    caption: "Winter 2023",
    description: "Pahalgam, Kashmir. A quiet morning immediately after the season's first snowfall.",
    image: "https://images.unsplash.com/photo-1626084610114-17183e84a2ca?auto=format&fit=crop&w=2400&q=80",
    meta: { camera: "Fuji X-T4", lens: "35MM F/1.4", settings: "1/500s ISO200" }
  }
];

const photoSections = [
  {
    title: "Life",
    description: "Photographs connected to daily life and personal moments.",
    photos: [
      { id: 1, src: "https://images.unsplash.com/photo-1544144433-d50aff500b91?auto=format&fit=crop&w=800&q=80", alt: "Coffee on table" },
      { id: 2, src: "https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?auto=format&fit=crop&w=800&q=80", alt: "Workspace" },
      { id: 3, src: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=800&q=80", alt: "Rainy window" },
    ]
  },
  {
    title: "Connected",
    description: "Photographs connected to stories, memories, people, or experiences.",
    photos: [
      { id: 4, src: "https://images.unsplash.com/photo-1525286102598-6415bf3721fb?auto=format&fit=crop&w=800&q=80", alt: "Street market" },
      { id: 5, src: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80", alt: "People interacting" },
      { id: 6, src: "https://images.unsplash.com/photo-1529156069898-49953eb1f5bc?auto=format&fit=crop&w=800&q=80", alt: "Friends walking" },
    ]
  },
  {
    title: "Travel",
    description: "Photographs from different places and journeys.",
    photos: [
      { id: 7, src: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80", alt: "Tokyo neon" },
      { id: 8, src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80", alt: "Dolomites mountains" },
      { id: 9, src: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80", alt: "Kashmir valley" },
    ]
  }
];

const behindTheShot = [
  {
    title: "Chasing the First Light",
    subtitle: "A visual essay on early mornings in the Himalayas.",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1483728642387-6c3ba6c6af5f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Faces of the Old City",
    subtitle: "Documenting the shifting culture of street vendors.",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1525286102598-6415bf3721fb?auto=format&fit=crop&w=1200&q=80"
  }
];

export default function Photography() {
  return (
    <motion.div
      key="photography"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-grow flex flex-col relative overflow-hidden"
    >
      <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 pt-0 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-24 mt-12 md:mt-24 max-w-4xl">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center"
          >
            Things I've Captured
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="font-serif text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tight"
          >
            Visual Diary.
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="mt-12 max-w-xl font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed"
          >
            A collection of moments gathered over the years. This is less of a portfolio and more of a personal visual diary, focusing on light, daily experiences, and the quiet spaces between noise.
          </motion.div>
        </div>

        {/* Favorites */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-32 group border-t border-zinc-800/80 pt-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-3">
              <div className="sticky top-24">
                <h2 className="font-serif text-3xl md:text-4xl text-zinc-200">Favorites</h2>
                <p className="font-sans text-sm text-zinc-400 font-light mt-2">The most meaningful frames.</p>
              </div>
            </div>
            <div className="lg:col-span-9 space-y-24">
              {favorites.map((photo, idx) => (
                 <div key={idx}>
                    <ParallaxImage 
                      src={photo.image}
                      alt={photo.title}
                      className="aspect-[16/9] lg:aspect-[21/9] bg-zinc-900 border border-zinc-800/50 block w-full mb-6 group-hover:border-zinc-700 transition-colors"
                      imageClassName="grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                    />
                    <div className="mt-6 flex flex-col md:flex-row justify-between items-start gap-4">
                      <div>
                        <h3 className="font-serif text-xl text-zinc-200">{photo.title}</h3>
                        <p className="font-sans text-xs text-zinc-500 mt-1 font-light tracking-wide">{photo.caption} — {photo.description}</p>
                      </div>
                      <div className="text-left md:text-right font-sans text-[10px] uppercase tracking-widest text-zinc-600 font-light space-y-1">
                        <p>{photo.meta.camera}</p>
                        <p>{photo.meta.lens}</p>
                        <p>{photo.meta.settings}</p>
                      </div>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Life, Connected, Travel Grids */}
        <div className="space-y-32 mb-32">
           {photoSections.map((section, idx) => (
             <motion.section 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-t border-zinc-800/80 pt-12"
             >
                <div className="lg:col-span-3">
                  <div className="sticky top-24">
                    <h2 className="font-serif text-3xl md:text-4xl text-zinc-200 mb-2">{section.title}</h2>
                    <p className="font-sans text-sm text-zinc-400 font-light">{section.description}</p>
                  </div>
                </div>
                
                <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {section.photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-[3/4] overflow-hidden border border-zinc-800/50 bg-zinc-900 group cursor-pointer">
                       <ParallaxImage 
                         src={photo.src} 
                         alt={photo.alt}
                         className="w-full h-full"
                         imageClassName="grayscale-[40%] group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                       />
                    </div>
                  ))}
                </div>
             </motion.section>
           ))}
        </div>

        {/* Behind The Shot */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-t border-zinc-800/80 pt-12"
        >
          <div className="lg:col-span-3">
            <div className="sticky top-24">
              <h2 className="font-serif text-3xl md:text-4xl text-zinc-200 mb-2">Behind The Shot</h2>
              <p className="font-sans text-sm text-zinc-400 font-light">The stories, technical challenges, and context behind selected frames.</p>
            </div>
          </div>
          
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            {behindTheShot.map((story, idx) => (
              <article key={idx} className="group cursor-pointer block">
                <ParallaxImage 
                  src={story.image}
                  alt={story.title}
                  className="w-full aspect-[16/10] bg-zinc-900 mb-8 border border-zinc-800/50"
                  imageClassName="opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                />
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-serif text-2xl text-zinc-200 mb-3">{story.title}</h3>
                    <p className="font-sans text-sm text-zinc-400 font-light">{story.subtitle}</p>
                  </div>
                  <div>
                    <ExploreArrow label="Read Notes" direction="up-right" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </motion.div>

        {/* Footer spacing */}
        <div className="h-16" />

      </div>
    </motion.div>
  );
}
