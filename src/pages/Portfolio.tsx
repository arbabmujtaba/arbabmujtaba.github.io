import { motion } from 'motion/react';
import ExploreArrow from '../components/ExploreArrow';
import ParallaxImage from '../components/ParallaxImage';
import Footer from '../components/Footer';

const engineeringProjects = [
  {
    title: "Student Attendance Management System",
    desc: "A desktop application designed to manage student attendance records efficiently. Includes database integration and a graphical user interface.",
    tags: ["Java", "MySQL", "Swing"],
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Network Simulator",
    desc: "A custom network simulation tool built to model packet transfers, network topologies, and routing algorithms.",
    tags: ["Python", "Networking"],
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Kashmiri AI Assistant",
    desc: "An experimental natural language processing model focusing on interpreting and generating conversational Kashmiri.",
    tags: ["AI", "NLP"],
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "DSP Surround",
    desc: "An audio engineering project utilizing C++ to process digital signals and simulate spatial surround sound environments.",
    tags: ["C++", "Audio Engineering"],
    image: "https://images.unsplash.com/photo-1618609377866-634612ce6240?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "MoodMix",
    desc: "An intelligent music discovery tool that leverages machine learning to curate playlists based on real-time spatial audio features and DSP.",
    tags: ["DSP", "Machine Learning", "Spatial Audio"],
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "SpecWars",
    desc: "A dynamic web-based application utilizing React and Node.js for real-time interactions.",
    tags: ["React", "Node.js"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Spotify Backend",
    desc: "A full-scale backend infrastructure replicating core Spotify features, managing robust REST APIs and database handling.",
    tags: ["Node.js", "Express", "MongoDB"],
    image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "DAVV Login Portal",
    desc: "A secure authentication portal developed for university administration, integrating session management and relational database structures.",
    tags: ["PHP", "MySQL"],
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "GeoProject",
    desc: "A geospatial analysis tool using Python to parse, visualize, and calculate insights from complex geographical datasets.",
    tags: ["Python", "Geospatial"],
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
  }
];

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
  return (
    <motion.div
      key="portfolio"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-grow flex flex-col relative overflow-hidden"
    >
      <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 pt-0 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-32 mt-12 md:mt-32 max-w-4xl relative">
          <div className="absolute top-0 left-0 -translate-x-[5%] -translate-y-[25%] text-[8rem] md:text-[14rem] font-serif font-bold tracking-tighter opacity-100 select-none pointer-events-none text-outline z-0">
            PORTFOLIO
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-orange-500 mb-6 relative z-10 flex items-center gap-4"
          >
            <span>Home</span>
            <span className="w-1 h-1 rounded-full bg-orange-500/50"></span>
            <span>Portfolio</span>
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="font-serif font-medium text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tighter relative z-10"
          >
            Portfolio
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="mt-12 max-w-xl font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed space-y-4 relative z-10"
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
          <div className="border-b border-zinc-800/80 pb-4 mb-16">
            <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Case Studies</h2>
          </div>

          <div className="space-y-24 md:space-y-32 mb-32">
            {engineeringProjects.map((project, idx) => (
              <div key={idx} className="group flex flex-col lg:flex-row gap-8 lg:gap-16">
                <div className="lg:w-[45%] order-2 lg:order-1 flex flex-col justify-center">
                  <span className="font-sans text-[9px] text-orange-500/80 mb-4 tracking-[0.2em] font-light">0{idx + 1}</span>
                  <h3 className="font-serif text-3xl md:text-4xl text-zinc-100 mb-6">{project.title}</h3>
                  <p className="font-sans text-zinc-400 text-sm font-light leading-relaxed mb-8 max-w-md">
                    {project.desc}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {project.tags.map(tag => (
                      <span key={tag} className="font-sans text-[9px] uppercase tracking-widest text-zinc-500 border border-zinc-800 px-3 py-1 bg-zinc-900/30">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="lg:w-[55%] order-1 lg:order-2">
                  <div className="aspect-[4/3] bg-zinc-900 border border-zinc-800/50 relative overflow-hidden flex items-center justify-center group-hover:border-orange-500/30 transition-colors duration-700">
                    <ParallaxImage 
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full opacity-60 mix-blend-luminosity"
                      imageClassName="grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/80 to-transparent pointer-events-none"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800/80 pt-16 mt-32 mb-24">
             <div className="mb-12">
                <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Technical Context</h2>
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
    </motion.div>
  );
}
