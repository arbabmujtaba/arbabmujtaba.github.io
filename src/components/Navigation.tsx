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
  const handleNavigate = (id: string) => {
    const container = document.querySelector('.custom-scrollbar');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    }
    setView(id);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex flex-col md:flex-row md:items-end gap-2 md:gap-4 font-sans text-xs uppercase tracking-[0.2em] relative z-20">
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
              onClick={() => handleNavigate(item.id)}
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

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a09]/85 backdrop-blur-xl border-t border-zinc-800/60 px-2 pt-3 pb-4 flex justify-around items-center md:hidden" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        {navItems.map((item, index) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={`mobile-${index}`}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`relative flex flex-col items-center gap-1 min-w-[64px] min-h-[44px] p-2 rounded-lg transition-colors duration-300 touch-manipulation ${isActive ? 'text-orange-400' : 'text-zinc-500'}`}
            >
              {isActive && (
                <div className="absolute top-1 w-1 h-1 rounded-full bg-orange-500" />
              )}
              <span className="font-mono text-[9px] opacity-60 mt-2">{item.num}</span>
              <span className="font-sans text-[10px] uppercase tracking-wider">
                {item.label.substring(0, 4)}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
