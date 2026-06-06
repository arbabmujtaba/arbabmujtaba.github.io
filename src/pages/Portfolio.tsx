import { motion } from 'motion/react';
import { ArrowUpRight, Github } from 'lucide-react';
import ExploreArrow from '../components/ExploreArrow';
import ParallaxImage from '../components/ParallaxImage';

const featuredProjects = [
  {
    title: "Aura Orchestration",
    desc: "A distributed micro-services orchestrator built for high-throughput messaging. Designed with fault tolerance and eventual consistency in mind, servicing millions of events daily.",
    tags: ["Go", "Kafka", "PostgreSQL", "Kubernetes"],
    year: "2024",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Epoch Metrics",
    desc: "A structural visualization engine for temporal data analysis. Converts heavily normalized relational datasets into cinematic, interactive dimensional models.",
    tags: ["TypeScript", "WebGL", "React", "Rust"],
    year: "2023",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
  }
];

const otherProjects = [
  { title: "Strata", desc: "Minimalist file system abstraction for multi-cloud blob storage routing.", tags: ["Node.js", "AWS", "GCP"], github: "#", demo: "#" },
  { title: "Vela", desc: "Headless CMS interface tailored for editorial and publishing workflows.", tags: ["React", "GraphQL", "Prisma"], github: "#", demo: "#" },
  { title: "Mono", desc: "Monospace typographic scale generator for code editors and technical docs.", tags: ["Svelte", "CSS", "Vite"], github: "#", demo: "#" },
  { title: "Nexus", desc: "Real-time collaborative canvas exploring conflict-free replicated data types.", tags: ["TypeScript", "CRDTs", "WebSockets"], github: "#", demo: "#" },
  { title: "Axiom", desc: "Zero-dependency mathematical expression parser and evaluation engine.", tags: ["Rust", "WASM"], github: "#", demo: "#" },
  { title: "Onyx", desc: "Dark-mode first component library specializing in cinematic motion rendering.", tags: ["Framer Motion", "React"], github: "#", demo: "#" },
];

const skills = {
  "Languages": ["TypeScript", "Go", "Rust", "Python", "SQL"],
  "Frameworks": ["React", "Next.js", "Node.js", "Express", "Tailwind CSS"],
  "Infrastructure": ["AWS", "Kubernetes", "Docker", "Terraform", "Kafka"],
  "Design": ["Figma", "Framer Motion", "Typography", "System Design"],
};

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
        <div className="mb-24 mt-12 md:mt-24 max-w-4xl">
          <motion.p 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6"
          >
            Things I've Built
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="font-serif text-5xl md:text-7xl lg:text-[7rem] leading-none text-zinc-100 tracking-tight"
          >
            Portfolio.
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1], duration: 1 }}
            className="mt-12 max-w-xl font-sans text-sm md:text-base text-zinc-400 font-light leading-relaxed"
          >
            A selection of engineering work and digital craft. Ranging from distributed systems to cinematic user interfaces. Building with an emphasis on performance, precision, and narrative.
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
            <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Selected Works</h2>
          </div>

          <div className="space-y-24 md:space-y-32">
            {featuredProjects.map((project, idx) => (
              <div key={idx} className="group flex flex-col lg:flex-row gap-8 lg:gap-16">
                <div className="lg:w-[45%] order-2 lg:order-1 flex flex-col justify-center">
                  <span className="font-sans text-[9px] text-zinc-600 mb-4 tracking-[0.2em] font-light">0{idx + 1}</span>
                  <h3 className="font-serif text-3xl md:text-4xl text-zinc-100 mb-6">{project.title}</h3>
                  <p className="font-sans text-zinc-400 text-sm font-light leading-relaxed mb-8 max-w-md">
                    {project.desc}
                  </p>
                  <div className="flex flex-wrap gap-4 mb-10">
                    {project.tags.map(tag => (
                      <span key={tag} className="font-sans text-[9px] uppercase tracking-widest text-zinc-500">{tag}</span>
                    ))}
                  </div>
                  <div className="mt-8">
                    <ExploreArrow label="View Case Study" direction="up-right" />
                  </div>
                </div>
                <div className="lg:w-[55%] order-1 lg:order-2">
                  <div className="aspect-[4/3] bg-zinc-900 border border-zinc-800/50 relative overflow-hidden flex items-center justify-center group-hover:border-zinc-700/80 transition-colors duration-700">
                    <ParallaxImage 
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full opacity-60"
                      imageClassName="grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/80 to-transparent"></div>
                    <span className="absolute bottom-8 right-8 font-serif italic text-zinc-600 text-xl font-light">Project Archive / {project.year}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Other Projects */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-32"
        >
          <div className="border-b border-zinc-800/80 pb-4 mb-12">
            <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Archive Grid</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherProjects.map((project, idx) => (
              <div key={idx} className="bg-zinc-900/20 border border-zinc-800/50 p-8 flex flex-col hover:border-zinc-700 hover:bg-zinc-900/40 transition-all duration-500">
                <div className="flex justify-between items-start mb-8">
                  <span className="font-sans text-[9px] text-zinc-600 tracking-[0.2em]">0{idx + 1}</span>
                  <div className="flex gap-4 text-zinc-600">
                    <a href={project.github} className="hover:text-zinc-300 transition-colors"><Github className="w-4 h-4" strokeWidth={1.5} /></a>
                    <a href={project.demo} className="hover:text-zinc-300 transition-colors"><ArrowUpRight className="w-4 h-4" strokeWidth={1.5} /></a>
                  </div>
                </div>
                <h3 className="font-serif text-xl text-zinc-200 mb-3">{project.title}</h3>
                <p className="font-sans text-xs text-zinc-400 mb-10 flex-grow font-light leading-relaxed">{project.desc}</p>
                <div className="flex gap-x-4 gap-y-2 flex-wrap">
                  {project.tags.map(tag => (
                    <span key={tag} className="font-sans text-[9px] uppercase tracking-widest text-zinc-600">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Skills & Background */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-32 mb-32"
        >
          {/* Competencies */}
          <div>
            <div className="border-b border-zinc-800/80 pb-4 mb-8">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Competencies</h2>
            </div>
            <div className="flex flex-col gap-6">
              {Object.entries(skills).map(([category, items]) => (
                <div key={category} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 border-b border-zinc-800/30 pb-6 last:border-0 last:pb-0">
                  <span className="font-sans text-[11px] uppercase tracking-widest text-zinc-200 col-span-1">{category}</span>
                  <div className="col-span-2 font-sans font-light text-sm text-zinc-400 leading-relaxed">
                    {items.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Background / Education & Resume */}
          <div>
            <div className="border-b border-zinc-800/80 pb-4 mb-8">
              <h2 className="font-sans text-[10px] uppercase tracking-[0.3em] text-zinc-500">Background</h2>
            </div>
            
            <div className="space-y-12">
              {/* Education items */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0">
                 <span className="font-sans text-[10px] sm:text-[9px] text-zinc-500 tracking-[0.2em] col-span-1 pt-1">2021 — 2023</span>
                 <div className="col-span-2 flex flex-col">
                   <span className="font-serif text-xl text-zinc-200 mb-2">M.S. Software Systems</span>
                   <span className="font-sans font-light text-sm text-zinc-400">Institute of Technology</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0">
                 <span className="font-sans text-[10px] sm:text-[9px] text-zinc-500 tracking-[0.2em] col-span-1 pt-1">2016 — 2020</span>
                 <div className="col-span-2 flex flex-col">
                   <span className="font-serif text-xl text-zinc-200 mb-2">B.S. Computer Science</span>
                   <span className="font-sans font-light text-sm text-zinc-400">University of Engineering</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 border-t border-zinc-800/30 pt-10">
                 <span className="font-sans text-[10px] sm:text-[9px] text-zinc-500 tracking-[0.2em] col-span-1 pt-1">ACHIEVEMENTS</span>
                 <div className="col-span-2 flex flex-col">
                   <span className="font-serif text-xl text-zinc-200 mb-2">Technical Excellence Award</span>
                   <span className="font-sans font-light text-sm text-zinc-400">Awarded for significant contributions to core infrastructure scaling in 2024.</span>
                 </div>
              </div>
              
              {/* Resume Link */}
              <div className="pt-8">
                <a href="#" className="inline-flex items-center text-[10px] font-sans uppercase tracking-[0.2em] text-zinc-100 font-light group hover:text-zinc-400 transition-colors pb-1 border-b border-zinc-800 hover:border-zinc-400">
                   Download Curriculum Vitae <ArrowUpRight className="ml-2 w-3 h-3 group-hover:-translate-y-[2px] group-hover:translate-x-[2px] transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer spacing */}
        <div className="h-16" />

      </div>
    </motion.div>
  );
}
