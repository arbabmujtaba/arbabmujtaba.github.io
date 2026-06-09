import { motion, useReducedMotion } from 'motion/react';
import AmbientGlow from './AmbientGlow';

export default function BackgroundLayer() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0a0a09]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a0a09_0%,#0b0b0a_45%,#070706_100%)]" />

      <motion.div
        aria-hidden="true"
        className="absolute inset-[-18%] opacity-80 will-change-transform"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                backgroundPosition: ['0% 0%', '58% 34%', '18% 78%', '0% 0%'],
              }
        }
        transition={{ duration: 38, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage:
            'radial-gradient(circle at 82% 8%, rgba(249,115,22,0.075), transparent 31%), radial-gradient(circle at 45% 42%, rgba(249,115,22,0.032), transparent 36%), radial-gradient(circle at 14% 78%, rgba(255,255,255,0.026), transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.022), transparent 42%, rgba(249,115,22,0.024))',
          backgroundSize: '150% 150%',
          transform: 'translate3d(0,0,0)',
        }}
      />

      <AmbientGlow
        className="-right-48 -top-56"
        size="54rem"
        color="rgba(249,115,22,0.082)"
        opacity={0.86}
        x={['0%', '-3%', '1%', '0%']}
        y={['0%', '4%', '1%', '0%']}
        duration={34}
      />
      <AmbientGlow
        className="left-[22%] top-[34%]"
        size="38rem"
        color="rgba(249,115,22,0.043)"
        opacity={0.72}
        x={['0%', '2%', '-2%', '0%']}
        y={['0%', '-3%', '2%', '0%']}
        duration={42}
        delay={2}
      />
      <AmbientGlow
        className="-bottom-64 left-[-12rem]"
        size="48rem"
        color="rgba(249,115,22,0.052)"
        opacity={0.62}
        x={['0%', '4%', '1%', '0%']}
        y={['0%', '-2%', '3%', '0%']}
        duration={46}
        delay={5}
      />

      <motion.div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.095] will-change-transform"
        animate={shouldReduceMotion ? undefined : { x: ['-1.5%', '1.5%', '-1.5%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '82px 82px',
          maskImage: 'radial-gradient(circle at 50% 42%, black 0%, transparent 74%)',
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.034] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.7'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.22)_62%,rgba(0,0,0,0.62)_100%)]" />
    </div>
  );
}
