import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Aperture, Focus } from 'lucide-react';
import ExploreArrow from '../components/ExploreArrow';
import ParallaxImage from '../components/ParallaxImage';
import Footer from '../components/Footer';
import ContentModal from '../components/ContentModal';
import { getPhotographyEntries } from '../lib/cms';
import { PhotographyEntry } from '../types';

const defaultPhotoSections = [
  {
    title: "Life",
    description: "Observations from the ordinary. Textures of the everyday.",
    photos: [
      { id: 1, src: "https://images.unsplash.com/photo-1544144433-d50aff500b91?auto=format&fit=crop&w=800&q=80", alt: "Coffee on table" },
      { id: 2, src: "https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?auto=format&fit=crop&w=800&q=80", alt: "Workspace" },
      { id: 3, src: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=800&q=80", alt: "Rainy window" },
    ]
  },
  {
    title: "Connected",
    description: "Stories, faces, and the invisible threads between people.",
    photos: [
      { id: 4, src: "https://images.unsplash.com/photo-1525286102598-6415bf3721fb?auto=format&fit=crop&w=800&q=80", alt: "Street market" },
      { id: 5, src: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80", alt: "People interacting" },
      { id: 6, src: "https://images.unsplash.com/photo-1529156069898-49953eb1f5bc?auto=format&fit=crop&w=800&q=80", alt: "Friends walking" },
    ]
  },
  {
    title: "Travel",
    description: "Journeys outward to journey inward. Places that left a mark.",
    photos: [
      { id: 7, src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80", alt: "Dolomites mountains" },
      { id: 8, src: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80", alt: "Kashmir valley" },
      { id: 9, src: "https://images.unsplash.com/photo-1483728642387-6c3ba6c6af5f?auto=format&fit=crop&w=800&q=80", alt: "Mountain paths" },
    ]
  }
];

const gearConfig = {
  "Cameras": ["Sony A7III // Primary System", "Fuji X-T4 // Everyday Carry", "Nikon F3 // 35mm Analog"],
  "Lenses": ["Sigma 24-70mm F2.8 Art", "Sony 35mm F1.4 GM", "Fujinon 56mm F1.2"],
  "Tools": ["Kodak Portra 400", "Black Pro-Mist 1/4", "Capture One Pro"]
};

export default function Photography() {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotographyEntry | null>(null);

  // Load from CMS
  const allPhotos = useMemo(() => getPhotographyEntries(), []);

  // Filter dynamic favorites
  const favorites = useMemo(() => {
    return allPhotos.filter(p => p.category === 'Favorites');
  }, [allPhotos]);

  // Behind the shot entries
  const behindTheShot = useMemo(() => {
    return allPhotos.filter(p => p.category === 'Behind The Shot' || p.category === 'Life' || p.category === 'Travel');
  }, [allPhotos]);

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
        <div className="mb-32 mt-12 md:mt-32 max-w-4xl relative">
          <div className="absolute top-0 left-0 -translate-x-[5%] -translate-y-[25%] text-[7rem] md:text-[12rem] font-serif font-bold tracking-tighter opacity-100 select-none pointer-events-none text-outline z-0">
            PHOTOGRAPHY
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-orange-500 mb-6 relative z-10 flex items-center gap-4"
          >
            <span>Home</span>
            <span className="w-1 h-1 rounded-full bg-orange-500/50"></span>
            <span>Photography</span>
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="font-serif font-medium text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tighter relative z-10"
          >
            Photography
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="mt-12 max-w-xl font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed relative z-10"
          >
            A collection of moments gathered over the years. This is less of a portfolio and more of a personal visual diary, focusing on memories, people, and the stories carried within light.
          </motion.div>
        </div>

        {/* Favorites dynamic section */}
        {favorites.length > 0 && (
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
              <div className="lg:col-span-9 space-y-24 mt-8 lg:mt-0">
                {favorites.map((photo, idx) => (
                   <div 
                     key={idx} 
                     onClick={() => setSelectedPhoto(photo)}
                     className="cursor-pointer group/photo"
                   >
                      <ParallaxImage 
                        src={photo.coverImage}
                        alt={photo.title}
                        className="aspect-[16/9] lg:aspect-[21/9] bg-zinc-900 border border-zinc-800/50 block w-full mb-8 group-hover/photo:border-orange-500/35 transition-colors"
                        imageClassName="grayscale-[20%] group-hover/photo:grayscale-0 transition-all duration-1000 scale-105 group-hover/photo:scale-100"
                      />
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="max-w-md">
                          <h3 className="font-serif text-2xl text-zinc-200 mb-2 group-hover/photo:text-orange-200 transition-colors">{photo.title}</h3>
                          <p className="font-sans text-sm text-zinc-400 font-light leading-relaxed">{photo.description}</p>
                        </div>
                        <div className="text-left md:text-right font-mono text-[9px] uppercase tracking-widest text-zinc-500 font-light space-y-1 mt-4 md:mt-0">
                          <p>Sony A7III / Fuji X-T4</p>
                          <p>Dynamic Creative Capture</p>
                        </div>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Life, Connected, Travel Grids */}
        <div className="space-y-32 mb-32">
           {defaultPhotoSections.map((section, idx) => (
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
                    <p className="font-sans text-sm text-zinc-400 font-light pr-4">{section.description}</p>
                  </div>
                </div>
                
                <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 lg:mt-0">
                  {section.photos.map((photo, pIdx) => (
                    <div key={photo.id} className={`relative overflow-hidden border border-zinc-850 bg-zinc-900 group cursor-pointer ${pIdx === 2 ? 'sm:col-span-2 aspect-[21/9]' : 'aspect-[3/4]'}`}>
                       <ParallaxImage 
                         src={photo.src} 
                         alt={photo.alt}
                         className="w-full h-full"
                         imageClassName="grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                       />
                       <div className="absolute inset-0 pointer-events-none border border-transparent group-hover:border-orange-500/20 transition-colors duration-700 z-10"></div>
                    </div>
                  ))}
                </div>
             </motion.section>
           ))}
        </div>

        {/* Dynamic Behind The Shot */}
        {behindTheShot.length > 0 && (
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
                <p className="font-sans text-sm text-zinc-400 font-light pr-4">Stories and context behind selected frames.</p>
              </div>
            </div>
            
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 mt-8 lg:mt-0">
              {behindTheShot.map((photo, idx) => (
                <article 
                  key={idx} 
                  onClick={() => setSelectedPhoto(photo)}
                  className="group cursor-pointer block"
                >
                  <div className="relative overflow-hidden mb-6 border border-zinc-850">
                    <ParallaxImage 
                      src={photo.coverImage}
                      alt={photo.title}
                      className="w-full aspect-[16/10] bg-zinc-900"
                      imageClassName="opacity-80 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700 scale-100 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 pointer-events-none border border-transparent group-hover:border-orange-500/20 transition-colors duration-700 z-10"></div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="font-serif text-2xl text-zinc-200 mb-3 group-hover:text-amber-100 transition-colors">{photo.title}</h3>
                      <p className="font-sans text-sm text-zinc-400 font-light leading-relaxed line-clamp-2">{photo.description}</p>
                    </div>
                    <div className="mt-2">
                      <ExploreArrow label="Read Journal" direction="up-right" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </motion.div>
        )}

        {/* Gear */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 border-t border-zinc-800/80 pt-12"
        >
          <div className="lg:col-span-3">
             <div className="sticky top-24">
              <h2 className="font-serif text-3xl md:text-4xl text-zinc-200 mb-2">The Tools</h2>
              <p className="font-sans text-sm text-zinc-400 font-light pr-4">What's in the bag.</p>
             </div>
          </div>
          <div className="lg:col-span-9 mt-8 lg:mt-0 grid grid-cols-1 sm:grid-cols-3 gap-12">
            {Object.entries(gearConfig).map(([category, items]) => (
               <div key={category}>
                 <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-orange-500 mb-6 flex items-center gap-3">
                   {category === 'Cameras' ? <Camera className="w-3.5 h-3.5" /> : category === 'Lenses' ? <Aperture className="w-3.5 h-3.5" /> : <Focus className="w-3.5 h-3.5" />}
                   {category}
                 </div>
                 <ul className="space-y-4">
                   {items.map((item, idx) => (
                     <li key={idx} className="font-sans text-sm text-zinc-400 font-light tracking-wide flex items-baseline">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 mr-3 inline-block shrink-0"></span>
                        {item}
                     </li>
                   ))}
                 </ul>
               </div>
            ))}
          </div>
        </motion.div>

        <Footer />
      </div>

      {/* Photography Immersive Case Study detail */}
      <AnimatePresence>
        {selectedPhoto && (
          <ContentModal 
            isOpen={!!selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            title={selectedPhoto.title}
            category={selectedPhoto.category}
            date={new Date(selectedPhoto.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            coverImage={selectedPhoto.coverImage}
            excerpt={selectedPhoto.description}
            body={selectedPhoto.story}
            metadata={{
              galleryImages: Array.isArray(selectedPhoto.galleryImages) 
                ? selectedPhoto.galleryImages.map(img => typeof img === 'string' ? img : Object.values(img)[0] as string)
                : []
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
