'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  const springConfig = { damping: 30, stiffness: 300 };
  const followerX = useSpring(cursorX, springConfig);
  const followerY = useSpring(cursorY, springConfig);

  const isHovering = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      dotX.set(e.clientX);
      dotY.set(e.clientY);
    };

    const handleMouseEnterLink = () => { isHovering.current = true; };
    const handleMouseLeaveLink = () => { isHovering.current = false; };

    window.addEventListener('mousemove', handleMouseMove);
    
    const links = document.querySelectorAll('a, button, [data-cursor="hover"]');
    links.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnterLink);
      el.addEventListener('mouseleave', handleMouseLeaveLink);
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cursorX, cursorY, dotX, dotY]);

  return (
    <>
      {/* Large follower ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[200] hidden lg:block"
        style={{
          x: followerX,
          y: followerY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <div className="w-10 h-10 rounded-full border border-white/20 mix-blend-difference" />
      </motion.div>

      {/* Small dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[200] hidden lg:block"
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white mix-blend-difference" />
      </motion.div>
    </>
  );
}
