import { useState, useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SparkleSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  onClick?: () => void;
  readOnly?: boolean;
  className?: string;
  autoFocus?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
}

const SparkleSearchBar = ({
  value,
  onChange,
  placeholder = 'your perfect look...',
  prefix = 'Find',
  onClick,
  readOnly = false,
  className,
  autoFocus = false,
}: SparkleSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prefixRef = useRef<HTMLSpanElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const particleIdRef = useRef(0);

  const isActive = isFocused || value.length > 0;

  const frameCountRef = useRef(0);

  const spawnParticles = useCallback((startX: number, width: number, height: number) => {
    // Spawn only 1 particle every 4 frames
    frameCountRef.current++;
    if (frameCountRef.current % 4 !== 0) return;
    if (particlesRef.current.length > 12) return;

    particlesRef.current.push({
      id: particleIdRef.current++,
      x: startX + Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1 + 0.3,
      opacity: Math.random() * 0.35 + 0.1,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.15,
      life: 0,
      maxLife: 80 + Math.random() * 60,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const animate = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      if (isActive) {
        const prefixEl = prefixRef.current;
        const spotlightStart = prefixEl ? prefixEl.offsetLeft + prefixEl.offsetWidth + 4 : 70;
        const centerY = h / 2;
        const endX = w - 8;

        // === Angled cone beam from cursor line spreading to right ===
        ctx.save();
        ctx.beginPath();
        // Cone: narrow at cursor, fans out vertically toward the right edge
        const coneNarrow = h * 0.18; // half-height at origin
        const coneWide = h * 0.55;   // half-height at far end
        ctx.moveTo(spotlightStart, centerY - coneNarrow);
        ctx.lineTo(endX, centerY - coneWide);
        ctx.lineTo(endX, centerY + coneWide);
        ctx.lineTo(spotlightStart, centerY + coneNarrow);
        ctx.closePath();
        ctx.clip();

        // Horizontal fade within the cone
        const beamGrad = ctx.createLinearGradient(spotlightStart, 0, endX, 0);
        beamGrad.addColorStop(0, 'hsla(35, 60%, 58%, 0.16)');
        beamGrad.addColorStop(0.08, 'hsla(34, 55%, 55%, 0.11)');
        beamGrad.addColorStop(0.25, 'hsla(32, 45%, 50%, 0.06)');
        beamGrad.addColorStop(0.5, 'hsla(30, 35%, 48%, 0.025)');
        beamGrad.addColorStop(1, 'hsla(28, 25%, 45%, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(spotlightStart, 0, endX - spotlightStart, h);

        // Radial glow at origin for brightness concentration
        const glowR = h * 0.9;
        const originGlow = ctx.createRadialGradient(spotlightStart, centerY, 0, spotlightStart, centerY, glowR);
        originGlow.addColorStop(0, 'hsla(38, 70%, 62%, 0.14)');
        originGlow.addColorStop(0.3, 'hsla(36, 60%, 58%, 0.06)');
        originGlow.addColorStop(1, 'hsla(34, 50%, 50%, 0)');
        ctx.fillStyle = originGlow;
        ctx.fillRect(spotlightStart - 4, 0, glowR + 4, h);

        ctx.restore();

        // Vertical golden cursor line
        const cursorX = spotlightStart;
        const cursorGradient = ctx.createLinearGradient(cursorX, h * 0.15, cursorX, h * 0.85);
        cursorGradient.addColorStop(0, 'hsla(40, 80%, 65%, 0)');
        cursorGradient.addColorStop(0.25, 'hsla(40, 90%, 70%, 0.65)');
        cursorGradient.addColorStop(0.5, 'hsla(40, 95%, 75%, 0.85)');
        cursorGradient.addColorStop(0.75, 'hsla(40, 90%, 70%, 0.65)');
        cursorGradient.addColorStop(1, 'hsla(40, 80%, 65%, 0)');

        ctx.strokeStyle = cursorGradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cursorX, h * 0.15);
        ctx.lineTo(cursorX, h * 0.85);
        ctx.stroke();

        // Small glow halo around cursor
        const glowGradient = ctx.createRadialGradient(cursorX, centerY, 0, cursorX, centerY, 14);
        glowGradient.addColorStop(0, 'hsla(40, 90%, 72%, 0.18)');
        glowGradient.addColorStop(0.5, 'hsla(40, 85%, 68%, 0.05)');
        glowGradient.addColorStop(1, 'hsla(40, 80%, 65%, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(cursorX - 14, 0, 28, h);

        // Sparse tiny sparkles
        spawnParticles(spotlightStart, spotlightWidth, h);

        particlesRef.current = particlesRef.current.filter(p => {
          p.life++;
          if (p.life > p.maxLife) return false;

          p.x += p.speedX;
          p.y += p.speedY;

          const lifeRatio = p.life / p.maxLife;
          const fadeIn = Math.min(lifeRatio * 4, 1);
          const fadeOut = lifeRatio > 0.6 ? 1 - (lifeRatio - 0.6) / 0.4 : 1;
          const alpha = p.opacity * fadeIn * fadeOut;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(40, 70%, 75%, ${alpha})`;
          ctx.fill();

          return true;
        });
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
    };
  }, [isActive, spawnParticles]);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        'relative flex items-center gap-3 rounded-full px-5 py-3.5 overflow-hidden cursor-text transition-all duration-300',
        'bg-foreground/90 backdrop-blur-md',
        isActive && 'ring-1 ring-accent/30',
        className
      )}
    >
      {/* Canvas for sparkle effects */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Search icon */}
      <Search size={17} className="relative z-[2] text-muted/80 flex-shrink-0" />

      {/* Prefix text */}
      <span
        ref={prefixRef}
        className="relative z-[2] text-[14px] font-serif italic text-muted/60 flex-shrink-0 select-none"
      >
        {prefix}
      </span>

      {/* Input */}
      {readOnly ? (
        <span className="relative z-[2] text-[16px] font-serif italic text-muted/40 flex-1">
          {placeholder}
        </span>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="relative z-[2] flex-1 bg-transparent text-[16px] font-serif italic text-background placeholder:text-muted/40 outline-none min-w-0"
        />
      )}
    </div>
  );
};

export default SparkleSearchBar;
