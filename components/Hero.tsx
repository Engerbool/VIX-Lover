import React, { useRef, useEffect } from 'react';

// Add type for global UnicornStudio object
declare global {
  interface Window {
    UnicornStudio: any;
  }
}

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  
  // Animation state refs
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);

  // Initialize Unicorn Studio (using original embed code pattern)
  useEffect(() => {
    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false };
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.0/dist/unicornStudio.umd.js";
      script.onload = () => {
        if (!window.UnicornStudio.isInitialized) {
          // Use global UnicornStudio directly as in original embed code
          (window as any).UnicornStudio.init();
          window.UnicornStudio.isInitialized = true;
        }
      };
      (document.head || document.body).appendChild(script);
    }
  }, []);

  // Text Animation Loop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      mouseRef.current = { x, y };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = (time: number) => {
      const t = time * 0.0015; 
      const idleX = Math.sin(t) * 0.15; 
      const idleY = Math.cos(t * 0.8) * 0.15;

      const targetX = mouseRef.current.x + idleX;
      const targetY = mouseRef.current.y + idleY;

      currentRef.current.x += (targetX - currentRef.current.x) * 0.08;
      currentRef.current.y += (targetY - currentRef.current.y) * 0.08;

      const { x, y } = currentRef.current;

      if (textRef.current) {
        textRef.current.style.transform = `
          perspective(1000px)
          rotateX(${y * -12}deg)
          rotateY(${x * 12}deg)
          translateZ(20px)
        `;
        
        // Pure white glow
        textRef.current.style.filter = `
            drop-shadow(${x * -15}px ${y * -15}px 10px rgba(0,0,0,0.5))
            drop-shadow(0 0 40px rgba(255, 255, 255, ${0.15 + Math.abs(x) * 0.15}))
        `;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-zinc-950"
    >
      <div className="absolute inset-0 z-0 opacity-50">
         <div 
            data-us-project="dRoE7ACs3i8iEW3Jp8ca" 
            style={{ width: '100%', height: '100%' }}
         ></div>
      </div>
      
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-zinc-950/10 via-transparent to-zinc-950/90 pointer-events-none" />

      {/* Main Title */}
      <h1
        ref={textRef}
        className="text-[12rem] md:text-[20rem] font-black tracking-tighter cursor-default select-none z-10 will-change-transform"
        style={{
            color: 'transparent',
            WebkitTextStroke: '2px rgba(255, 255, 255, 0.2)',
            backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
            WebkitBackgroundClip: 'text',
        }}
      >
        VIX
      </h1>

      <div className="absolute bottom-[20%] flex flex-col items-center z-20">
         {/* 
            Monochrome White/Zinc Gradient
            Moved to 20% height.
            Soft, subtle neon glow effect.
         */}
         <p className="mono text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 via-white to-zinc-400 text-sm tracking-[0.8em] uppercase font-bold drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
            Volatility Index
         </p>
      </div>
    </div>
  );
};

export default Hero;