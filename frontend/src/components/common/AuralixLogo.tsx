import React from 'react';
import auralixLogo from '../../assets/auralix-logo.png';

interface AuralixLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const AuralixLogo: React.FC<AuralixLogoProps> = ({ className = '', size = 'md', showSubtitle = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      {/* Auralix Technologies PNG Logo */}
      <div className={`flex-shrink-0 flex items-center justify-center ${iconSizes[size]} rounded-lg overflow-hidden bg-white p-0.5 shadow-lg shadow-orange-500/10`}>
        <img
          src={auralixLogo}
          alt="Auralix Technologies Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Text block — stacked, constrained to available width */}
      <div className="flex flex-col min-w-0 overflow-hidden">
        <div className="flex flex-col leading-tight">
          <span className="font-black text-sm tracking-wider text-white whitespace-nowrap">
            AURALIX
          </span>
          <span className="font-semibold text-xs tracking-wider text-orange-500 whitespace-nowrap">
            TECHNOLOGIES
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] uppercase tracking-widest font-medium text-slate-400 whitespace-nowrap mt-0.5">
            Revenue Hub
          </span>
        )}
      </div>
    </div>
  );
};
