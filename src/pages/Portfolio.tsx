import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ExploreArrow from '../components/ExploreArrow';
import ParallaxImage from '../components/ParallaxImage';
import Footer from '../components/Footer';
import ContentModal from '../components/ContentModal';
import SafeImage from '../components/SafeImage';
import { getPortfolioProjects } from '../lib/cms';
import { normalizeImagePath } from '../lib/image';
import { PortfolioProject } from '../types';

const technicalSkills = [
  { category: "Java", items: ["Swing", "JDBC", "OOP", "Desktop Applications"] },
  { category: "Python", items: ["Scripting", "Network Tools", "Machine Learning"] },
  { category: "PHP", items: ["Authentication Systems", "MySQL"] },
  { category: "React", items: ["Hooks", "Components", "Frontend Applications"] },
  { category: "Node.js", items: ["Express", "REST APIs", "MongoDB", "MERN"] },
  { category: "TypeScript", items: ["Interfaces", "Scalable Applications"] },
  { category: "C++", items: ["DSP", "Audio Engineering", "Spatial Audio"] },
  { category: "Networking", items: ["LoRaWAN", "Packet Simulation", "Network Topologies"] }
];

export default function Portfolio() {
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  // Load from CMS dynamically
  const projects = useMemo(() => getPortfolioProjects(), []);

  return (
    <motion.div
      key="portfolio"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-grow flex flex-col relative overflow-hidden"
    >
      <div className="page-shell flex-grow overflow-y-auto custom-scrollbar pt-0 relative z-10">
        
        {/* Hero Section */}
        <div className="page-intro" data-mark="WORK">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="page-eyebrow"
          >
            <span>Home</span>
            <span className="w-1 h-1 rounded-full bg-orange-500/50"></span>
            <span>Portfolio</span>
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="page-title"
          >
            Portfolio
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="page-description"
          >
            <p className="text-lg">
              A collection of engineering case studies. Building with an emphasis on performance, precision, and robust architectures.
            </p>
          </motion.div>
        </div>

        {/* Featured Projects */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-32"
        >
          <div className="content-rule pt-7 mb-12 md:mb-20 flex items-baseline justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.26em] text-orange-400/80">Selected case studies</h2>
            <span className="font-mono text-[10px] text-zinc-600">00{projects.length}</span>
          </div>

          <div className="space-y-12 md:space-y-16 lg:space-y-20 mb-16 md:mb-24 lg:mb-32">
            {projects.map((project, idx) => {
              // Extract string array tags
              const tags: string[] = Array.isArray(project.techStack) 
                ? project.techStack.map((item: any) => typeof item === 'string' ? item : item.tech || '')
                : [];

              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedProject(project)}
                  className="group grid cursor-pointer gap-8 border-b border-zinc-800/70 pb-12 last:border-0 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-center lg:gap-16 lg:pb-16"
                >
                  <div className="order-2 flex flex-col justify-center lg:order-1">
                    <span className="font-mono text-[10px] text-orange-400 mb-5 tracking-[0.2em]">0{idx + 1} / CASE STUDY</span>
                    <h3 className="font-serif text-4xl leading-[0.95] tracking-tight md:text-5xl text-zinc-100 mb-6 group-hover:text-orange-100 transition-colors">{project.title}</h3>
                    <p className="font-sans text-zinc-400 text-sm font-light leading-relaxed mb-8 max-w-md md:text-base">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, tagIdx) => (
                        <span key={tagIdx} className="font-sans text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-850 px-3 py-1 bg-zinc-900/30">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="order-1 lg:order-2">
                    <div className="image-frame aspect-[4/3] flex items-center justify-center">
                      {normalizeImagePath(project.projectImage) ? (
                        <ParallaxImage 
                          src={project.projectImage}
                          alt={project.title}
                          className="w-full h-full opacity-60 mix-blend-luminosity"
                          imageClassName="grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                          sizes="(min-width: 1024px) 45vw, 100vw"
                        />
                      ) : (
                        <SafeImage src={project.projectImage} alt={project.title} className="w-full h-full opacity-40" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/80 to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="content-rule pt-8 mt-24 mb-24">
             <div className="mb-12">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.26em] text-orange-400/80">Technical context</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                {technicalSkills.map((section, idx) => (
                  <div key={idx}>
                    <h3 className="font-serif italic text-xl text-zinc-200 mb-6">{section.category}</h3>
                    <ul className="space-y-4">
                      {section.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="font-sans font-light text-sm text-zinc-400 relative pl-4">
                          <span className="absolute left-0 top-[0.4rem] w-1 h-1 rounded-full bg-orange-500/50"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
             </div>
          </div>
        </motion.div>

        <Footer />
      </div>

      {/* Immersive overlay metadata viewer */}
      <AnimatePresence>
        {selectedProject && (
          <ContentModal 
            isOpen={!!selectedProject}
            onClose={() => setSelectedProject(null)}
            title={selectedProject.title}
            category="Case Study"
            coverImage={selectedProject.projectImage}
            excerpt={selectedProject.description}
            body={selectedProject.body}
            metadata={{
              githubLink: selectedProject.githubLink,
              liveLink: selectedProject.liveLink,
              techStack: Array.isArray(selectedProject.techStack) 
                ? selectedProject.techStack.map((item: any) => typeof item === 'string' ? item : item.tech || '')
                : []
            }}
            customization={selectedProject.customization}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
