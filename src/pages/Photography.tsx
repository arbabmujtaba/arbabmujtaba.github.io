import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Aperture, Focus } from 'lucide-react';
import ExploreArrow from '../components/ExploreArrow';
import ParallaxImage from '../components/ParallaxImage';
import Footer from '../components/Footer';
import ContentModal from '../components/ContentModal';
import SafeImage from '../components/SafeImage';
import { getPhotographyEntries, getGearItems, getGalleryItems } from '../lib/cms';
import { normalizeImagePath } from '../lib/image';
import { PhotographyEntry, GearItem, PhotoGalleryItem } from '../types';

export default function Photography() {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotographyEntry | null>(null);

  // Load from CMS
  const allPhotos = useMemo(() => getPhotographyEntries(), []);
  const gearItems = useMemo(() => getGearItems().filter(g => g.visible).sort((a, b) => a.order - b.order), []);
  const galleryItems = useMemo(() => getGalleryItems().filter(g => g.visible).sort((a, b) => a.order - b.order), []);

  // Group gear by category
  const gearByCategory = useMemo(() => {
    return gearItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, GearItem[]>);
  }, [gearItems]);

  // Group gallery by category for grid sections
  const gallerySections = useMemo(() => {
    const grouped = galleryItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, PhotoGalleryItem[]>);

    return Object.entries(grouped).map(([category, photos]) => ({
      title: category,
      description: photos[0]?.body || photos[0]?.description || `A collection of ${category.toLowerCase()} photography.`,
      photos
    }));
  }, [galleryItems]);

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
      <div className="flex-grow overflow-y-auto custom-scrollbar px-4 sm:px-6 md:p-12 lg:p-16 pt-0 relative z-10 w-full max-w-7xl mx-auto">

        {/* Hero Section */}
        <div className="mb-16 md:mb-24 lg:mb-32 mt-8 sm:mt-12 md:mt-32 max-w-4xl relative overflow-hidden">
          <div className="absolute top-0 left-0 -translate-x-[5%] -translate-y-[25%] text-[2.5rem] sm:text-[4rem] md:text-[7rem] lg:text-[12rem] font-serif font-bold tracking-tighter opacity-100 select-none pointer-events-none text-outline z-0">
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
            className="font-serif font-medium text-4xl sm:text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tighter relative z-10"
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
                      {normalizeImagePath(photo.coverImage) ? (
                        <ParallaxImage
                          src={photo.coverImage}
                          alt={photo.title}
                          className="aspect-[16/9] lg:aspect-[21/9] bg-zinc-900 border border-zinc-800/50 block w-full mb-8 group-hover/photo:border-orange-500/35 transition-colors"
                          imageClassName="grayscale-[20%] group-hover/photo:grayscale-0 transition-all duration-1000 scale-105 group-hover/photo:scale-100"
                        />
                      ) : (
                        <div className="aspect-[16/9] lg:aspect-[21/9] bg-zinc-900 border border-zinc-800/50 block w-full mb-8" />
                      )}
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

        {/* Dynamic Gallery Grids */}
        {gallerySections.length > 0 && (
          <div className="space-y-16 md:space-y-24 lg:space-y-32 mb-16 md:mb-24 lg:mb-32">
            {gallerySections.map((section, idx) => (
              <motion.section
                key={section.title}
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
                    <div key={photo.slug} className={`relative overflow-hidden border border-zinc-850 bg-zinc-900 group cursor-pointer ${pIdx === 2 ? 'sm:col-span-2 aspect-[16/9] sm:aspect-[21/9]' : 'aspect-[3/4]'}`}>
                       <ParallaxImage
                         src={photo.image}
                         alt={photo.title}
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
        )}

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
                    {normalizeImagePath(photo.coverImage) ? (
                      <ParallaxImage
                        src={photo.coverImage}
                        alt={photo.title}
                        className="w-full aspect-[16/10] bg-zinc-900"
                        imageClassName="opacity-80 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700 scale-100 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full aspect-[16/10] bg-zinc-900" />
                    )}
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

        {/* Dynamic Gear */}
        {Object.keys(gearByCategory).length > 0 && (
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
                <p className="font-sans text-sm text-zinc-400 font-light pr-4">What&apos;s in the bag.</p>
               </div>
            </div>
            <div className="lg:col-span-9 mt-8 lg:mt-0 grid grid-cols-1 sm:grid-cols-3 gap-12">
              {Object.entries(gearByCategory).map(([category, items]) => (
                 <div key={category}>
                   <div className="font-sans text-[10px] uppercase tracking-[0.3em] text-orange-500 mb-6 flex items-center gap-3">
                     {category === 'Cameras' ? <Camera className="w-3.5 h-3.5" /> : category === 'Lenses' ? <Aperture className="w-3.5 h-3.5" /> : <Focus className="w-3.5 h-3.5" />}
                     {category}
                   </div>
                   <ul className="space-y-4">
                     {items.map((item) => (
                       <li key={item.slug} className="font-sans text-sm text-zinc-400 font-light tracking-wide flex items-baseline">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 mr-3 inline-block shrink-0"></span>
                          {item.title}
                       </li>
                     ))}
                   </ul>
                 </div>
              ))}
            </div>
          </motion.div>
        )}

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
            customization={selectedPhoto.customization}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
