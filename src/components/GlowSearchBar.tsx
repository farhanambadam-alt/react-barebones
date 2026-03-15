import { Search } from 'lucide-react';

interface GlowSearchBarProps {
  onClick?: () => void;
}

const GlowSearchBar = ({ onClick }: GlowSearchBarProps) => {
  return (
    <button
      onClick={onClick}
      className="glow-search-bar group relative w-full flex items-center gap-3 rounded-[20px] px-5 py-4 overflow-hidden cursor-pointer transition-transform active:scale-[0.98]"
    >
      {/* Dark background layer */}
      <div className="absolute inset-0 bg-truffle rounded-[20px] border border-[hsl(var(--bronze)/0.15)]" />

      {/* Ambient glow behind the cursor line */}
      <div className="glow-search-ambient absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-32 pointer-events-none" />

      {/* Sparkle particles */}
      <div className="glow-search-sparkle absolute left-[calc(50%-8px)] top-[20%] w-1 h-1 rounded-full" />
      <div className="glow-search-sparkle glow-search-sparkle--delay1 absolute left-[calc(50%+6px)] top-[35%] w-[3px] h-[3px] rounded-full" />
      <div className="glow-search-sparkle glow-search-sparkle--delay2 absolute left-[calc(50%-4px)] top-[60%] w-0.5 h-0.5 rounded-full" />
      <div className="glow-search-sparkle glow-search-sparkle--delay3 absolute left-[calc(50%+10px)] top-[75%] w-[2px] h-[2px] rounded-full" />
      <div className="glow-search-sparkle glow-search-sparkle--delay1 absolute left-[calc(50%-12px)] top-[45%] w-[2px] h-[2px] rounded-full" />

      {/* Golden cursor line */}
      <div className="glow-search-cursor absolute left-1/2 -translate-x-1/2 top-[15%] bottom-[15%] w-[2px] rounded-full pointer-events-none" />

      {/* Content */}
      <Search size={17} className="relative z-10 text-[hsl(var(--bronze))] flex-shrink-0 opacity-60" />
      <div className="relative z-10 flex items-center gap-0 flex-1">
        <span className="font-serif text-[16px] text-[hsl(var(--champagne))] opacity-50 tracking-wide">
          Find
        </span>
        <span className="w-10" /> {/* spacer for cursor */}
        <span className="font-serif italic text-[16px] text-[hsl(var(--champagne))] opacity-80 tracking-wide">
          your perfect look...
        </span>
      </div>
    </button>
  );
};

export default GlowSearchBar;
