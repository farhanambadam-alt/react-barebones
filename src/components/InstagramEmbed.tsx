import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

let scriptLoaded = false;
function loadInstagramScript() {
  if (scriptLoaded) return;
  scriptLoaded = true;
  const s = document.createElement('script');
  s.src = 'https://www.instagram.com/embed.js';
  s.async = true;
  document.body.appendChild(s);
}

interface InstagramEmbedProps {
  /** Full permalink, e.g. https://www.instagram.com/p/CqpaFBnJhcl/ */
  url: string;
  /** 'post' for square images, 'reel' for 9:16 vertical video */
  type: 'post' | 'reel';
  /** Callback when the embed has loaded */
  onLoaded?: () => void;
}

const InstagramEmbed = ({ url, type, onLoaded }: InstagramEmbedProps) => {
  const ref = useRef<HTMLQuoteElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadInstagramScript();

    const processEmbed = () => {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
        setTimeout(() => {
          setLoaded(true);
          onLoaded?.();
        }, 1500);
      }
    };

    if (window.instgrm) {
      processEmbed();
    } else {
      const interval = setInterval(() => {
        if (window.instgrm) {
          clearInterval(interval);
          processEmbed();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [url, onLoaded]);

  const isReel = type === 'reel';

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border bg-background"
      style={{ aspectRatio: isReel ? '9/12' : '1/1' }}
    >
      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Skeleton className="absolute inset-0 rounded-none" />
          {isReel && (
            <div className="z-20 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Play size={16} className="text-foreground ml-0.5" fill="currentColor" />
            </div>
          )}
        </div>
      )}

      {/* Viewport that crops the Instagram chrome */}
      <div className="relative w-full h-full overflow-hidden">
        <div
          className="absolute"
          style={{
            top: isReel ? '-60px' : '-60px',
            left: '-5%',
            width: '110%',
            height: isReel
              ? 'calc(100% + 60px + 100px)'
              : 'calc(100% + 60px + 80px)',
          }}
        >
          <blockquote
            ref={ref}
            className="instagram-media"
            data-instgrm-permalink={url}
            data-instgrm-version="14"
            data-instgrm-captioned={undefined}
            style={{
              width: '100%',
              height: '100%',
              margin: 0,
              padding: 0,
              border: 0,
              minWidth: '100%',
              display: 'block',
              background: 'transparent',
            }}
          >
            <a href={url} />
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default InstagramEmbed;
