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
    <nav className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 font-sans text-xs uppercase tracking-[0.2em] relative z-20">
      {navItems.map((item, index) => {
        const isActive = activeView === item.id;
        
        return (
          <motion.button
            key={index}
            type="button"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6 + index * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={() => setView(item.id)}
            className="group flex flex-row items-center cursor-pointer min-h-[44px] md:min-h-0 px-2 md:px-0 rounded md:rounded-none hover:bg-zinc-900/40 md:hover:bg-transparent transition-colors md:transition-none"
          >
            <span className={`text-zinc-600 md:mr-4 font-light text-[9px] transform transition-transform duration-500 ease-out md:group-hover:-translate-x-3 ${isActive ? 'text-orange-500/80' : ''}`}>
              {item.num}
            </span>
            <span className={`transition-colors duration-500 ease-out tracking-[0.2em] relative ${isActive ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
              {item.label}
              {isActive && (
                <motion.div 
                  layoutId="nav-indicator"
                  className="absolute -right-4 top-[40%] w-1.5 h-1.5 rounded-full bg-orange-500 hidden md:block"
                />
              )}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
