import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Instagram, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import InstagramEmbed from '@/components/InstagramEmbed';

interface GalleryItem {
  type: 'post' | 'reel';
  url: string;
  thumb: string;
}

interface InstagramMediaDrawerProps {
  open: boolean;
  onClose: () => void;
  items: GalleryItem[];
  activeIndex: number;
  onChangeIndex: (index: number) => void;
}

const InstagramMediaDrawer = ({
  open,
  onClose,
  items,
  activeIndex,
  onChangeIndex,
}: InstagramMediaDrawerProps) => {
  const [entering, setEntering] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const current = items[activeIndex];

  // Reset embed loaded state when index changes
  useEffect(() => { setEmbedLoaded(false); }, [activeIndex]);

  // Animate in
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setEntering(true));
    } else {
      setEntering(false);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Scroll active thumb into view
  useEffect(() => {
    if (!thumbsRef.current) return;
    const el = thumbsRef.current.children[activeIndex] as HTMLElement;
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeIndex]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onChangeIndex((activeIndex - 1 + items.length) % items.length);
      if (e.key === 'ArrowRight') onChangeIndex((activeIndex + 1) % items.length);
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, activeIndex, items.length, onChangeIndex]);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      setEntering(false);
      onClose();
    }, 300);
  }, [onClose]);

  if (!open || !current) return null;

  const isReel = current.type === 'reel';

  return (
    <div className="fixed inset-0 z-[100]" style={{ isolation: 'isolate' }}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-foreground/60 backdrop-blur-sm transition-opacity duration-300 ${
          entering && !exiting ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Drawer panel - slides up from bottom */}
      <div
        ref={drawerRef}
        className={`absolute bottom-0 left-0 right-0 z-[101] bg-card rounded-t-3xl border-t border-border shadow-2xl transition-transform duration-300 ease-out ${
          entering && !exiting ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '88vh' }}
      >
        {/* Close button - sits at the top-right of the drawer panel itself */}
        <button
          onClick={handleClose}
          className="absolute -top-14 right-4 z-[102] transition-all duration-300"
          style={{
            opacity: entering && !exiting ? 1 : 0,
            transform: entering && !exiting ? 'scale(1)' : 'scale(0.9)',
          }}
          aria-label="Close"
        >
          <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-card/90 backdrop-blur-md flex items-center justify-center border border-border shadow-lg">
            <X size={18} className="text-foreground" />
          </div>
        </button>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <div className="flex items-center gap-2">
            <Instagram size={14} className="text-primary" />
            <span className="text-[13px] font-heading font-semibold text-foreground capitalize">
              {current.type}
            </span>
          </div>
          <span className="text-[12px] font-body text-muted-foreground">
            {activeIndex + 1} / {items.length}
          </span>
        </div>

        {/* Scrollable content area */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(88vh - 100px)' }}>
          {/* Main media area with swipe */}
          <div
            className="relative px-4"
            onTouchStart={(e) => {
              touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }}
            onTouchEnd={(e) => {
              if (!touchRef.current) return;
              const dx = touchRef.current.x - e.changedTouches[0].clientX;
              const dy = Math.abs(touchRef.current.y - e.changedTouches[0].clientY);
              touchRef.current = null;
              if (dy > Math.abs(dx)) return;
              if (Math.abs(dx) > 40) {
                if (dx > 0) onChangeIndex((activeIndex + 1) % items.length);
                else onChangeIndex((activeIndex - 1 + items.length) % items.length);
              }
            }}
          >
            {/* Thumbnail preview shown first, Instagram embed loads on top */}
            <div
              key={activeIndex}
              className="relative w-full max-w-[400px] mx-auto rounded-2xl overflow-hidden bg-secondary border border-border"
              style={{
                aspectRatio: isReel ? '9/16' : '1/1',
                maxHeight: isReel ? '55vh' : '45vh',
              }}
            >
              {/* Thumbnail as base layer - always visible until embed loads */}
              <img
                src={current.thumb}
                alt={`${current.type} ${activeIndex + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  embedLoaded ? 'opacity-0' : 'opacity-100'
                }`}
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />

              {/* Play icon overlay on thumbnail for reels */}
              {isReel && !embedLoaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-card/90 backdrop-blur-md flex items-center justify-center shadow-lg">
                    <Play size={22} className="text-foreground ml-0.5" fill="currentColor" />
                  </div>
                </div>
              )}

              {/* Loading skeleton overlay */}
              {!embedLoaded && (
                <div className="absolute inset-0 z-[5]">
                  <Skeleton className="w-full h-full rounded-none opacity-30" />
                </div>
              )}

              {/* Instagram embed on top */}
              <div
                className={`relative z-20 w-full h-full transition-opacity duration-500 ${
                  embedLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <InstagramEmbed
                  url={current.url}
                  type={current.type}
                  onLoaded={() => setEmbedLoaded(true)}
                />
              </div>
            </div>

            {/* Nav arrows for desktop */}
            {items.length > 1 && (
              <>
                <button
                  onClick={() => onChangeIndex((activeIndex - 1 + items.length) % items.length)}
                  className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 backdrop-blur-md border border-border items-center justify-center hover:bg-card transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft size={16} className="text-foreground" />
                </button>
                <button
                  onClick={() => onChangeIndex((activeIndex + 1) % items.length)}
                  className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 backdrop-blur-md border border-border items-center justify-center hover:bg-card transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight size={16} className="text-foreground" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="px-4 pt-4 pb-[max(env(safe-area-inset-bottom),20px)]">
            <div
              ref={thumbsRef}
              className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1 justify-center items-center"
            >
              {items.map((item, i) => {
                const isActive = i === activeIndex;
                const isItemReel = item.type === 'reel';
                return (
                  <button
                    key={i}
                    onClick={() => onChangeIndex(i)}
                    className={`relative flex-shrink-0 overflow-hidden transition-all duration-200 ease-out ${
                      isActive
                        ? 'w-[60px] h-[60px] rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-card scale-105'
                        : 'w-[50px] h-[50px] rounded-xl opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={item.thumb}
                      alt={`${item.type} ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      draggable={false}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                    {isItemReel && (
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/30">
                        <Play size={10} className="text-primary-foreground" fill="white" />
                      </div>
                    )}
                    {/* Type badge */}
                    <div className="absolute bottom-0.5 left-0.5 right-0.5">
                      <div className="bg-foreground/60 backdrop-blur-sm rounded-md px-1 py-px flex items-center justify-center gap-0.5">
                        <Instagram size={7} className="text-primary-foreground" />
                        <span className="text-[7px] font-heading text-primary-foreground font-medium capitalize leading-none">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramMediaDrawer;
