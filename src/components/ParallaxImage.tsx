import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'motion/react';

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}

export default function ParallaxImage({ src, alt, className = "", imageClassName = "" }: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70, damping: 20, restDelta: 0.001
  });
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const disableParallax = shouldReduceMotion || isMobile;
  const y = useTransform(smoothProgress, [0, 1], disableParallax ? ["0%", "0%"] : ["-15%", "15%"]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y, height: disableParallax ? '100%' : '130%', top: disableParallax ? '0%' : '-15%', position: 'absolute', width: '100%', left: 0 }}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`w-full h-full object-cover ${imageClassName}`}
        />
      </motion.div>
    </div>
  );
}
