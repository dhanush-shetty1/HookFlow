import React from 'react';

type SpotlightProps = {
  className?: string;
  fill?: string;
};

export const Spotlight: React.FC<SpotlightProps> = ({
  className = '',
  fill = 'white',
}) => {
  return (
    <div
      className={`pointer-events-none absolute z-[1] h-[500px] w-[500px] md:w-[800px] md:h-[800px] rounded-full opacity-25 blur-3xl transform-gpu will-change-transform ${className}`}
      style={{
        background: `radial-gradient(circle, ${fill === 'white' ? 'rgba(255,255,255,0.15)' : fill} 0%, rgba(255,255,255,0.02) 50%, transparent 75%)`,
      }}
    />
  );
};
