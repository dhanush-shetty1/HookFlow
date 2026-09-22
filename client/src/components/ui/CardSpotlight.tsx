import React, { useRef, useState } from 'react';

interface CardSpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export const CardSpotlight: React.FC<CardSpotlightProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.08)',
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || !spotlightRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spotlightRef.current.style.background = `radial-gradient(450px circle at ${x}px ${y}px, ${spotlightColor}, transparent 65%)`;
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-6 transition-all duration-300 hover:border-zinc-700/80 transform-gpu ${className}`}
      {...props}
    >
      <div
        ref={spotlightRef}
        className={`pointer-events-none absolute -inset-px transition-opacity duration-300 will-change-transform ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
