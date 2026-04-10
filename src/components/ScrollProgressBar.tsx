'use client';

import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

export function ScrollProgressBar() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  if (reduceMotion) {
    return null;
  }

  return (
    <motion.div
      aria-hidden
      className="fixed left-0 right-0 top-0 z-[70] h-1 origin-left bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400"
      style={{ scaleX }}
    />
  );
}