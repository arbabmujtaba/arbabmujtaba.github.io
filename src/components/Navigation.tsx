import { motion } from 'motion/react';

const navItems = [
  { id: 'portfolio', num: '01', label: 'Portfolio' },
  { id: 'journal', num: '02', label: 'Journal' },
  { id: 'tech', num: '03', label: 'Tech' },
  { id: 'photography', num: '04', label: 'Photography' },
  { id: 'collection', num: '05', label: 'Collection' },
];

interface NavigationProps {
  activeView: string;
  setView: (view: string) => void;
}

export default function Navigation({ activeView, setView }: NavigationProps) {
  return (
    <nav className="flex flex-col items-end space-y-4 font-sans text-xs uppercase tracking-[0.2em] relative z-20">
      {navItems.map((item, index) => {
        const isActive = activeView === item.id;
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6 + index * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={() => setView(item.id)}
            className="group flex flex-col md:flex-row md:items-center cursor-pointer overflow-hidden items-end"
          >
            <span className={`text-zinc-600 md:mr-6 font-light text-[9px] transform transition-transform duration-500 ease-out md:group-hover:-translate-x-3 mb-1 md:mb-0 ${isActive ? 'text-zinc-400' : ''}`}>
              {item.num}
            </span>
            <span className={`transition-colors duration-500 ease-out tracking-[0.25em] ${isActive ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
              {item.label}
            </span>
          </motion.div>
        );
      })}
    </nav>
  );
}
