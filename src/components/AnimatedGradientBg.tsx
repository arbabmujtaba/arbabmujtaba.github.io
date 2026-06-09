import { motion, useReducedMotion } from 'motion/react';

export default function AnimatedGradientBg() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0a0a09]">
      <motion.div
        className="absolute inset-[-12%]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                backgroundPosition: ['0% 0%', '70% 38%', '20% 86%', '0% 0%'],
              }
        }
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 16%, rgba(249,115,22,0.10), transparent 28%), radial-gradient(circle at 82% 42%, rgba(255,255,255,0.045), transparent 34%), radial-gradient(circle at 38% 90%, rgba(249,115,22,0.055), transparent 31%), linear-gradient(135deg, rgba(255,255,255,0.035), transparent 35%, rgba(249,115,22,0.035))',
          backgroundSize: '150% 150%',
        }}
      />

      <motion.div
        className="absolute inset-0 opacity-[0.18]"
        animate={shouldReduceMotion ? undefined : { x: ['-2%', '2%', '-2%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.038) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(circle at center, black 0%, transparent 72%)',
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,9,0.15),rgba(10,10,9,0.55)_72%,rgba(10,10,9,0.88))]" />
    </div>
  );
}
