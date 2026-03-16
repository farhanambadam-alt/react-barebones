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

  const isActive = true; // Always on

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
        const cursorX = prefixEl ? prefixEl.offsetLeft + prefixEl.offsetWidth + 4 : 70;
        const centerY = h / 2;
        const leftX = 8;
        const rightX = w - 8;

        // === RIGHT cone: spreads from cursor toward right edge ===
        ctx.save();
        ctx.beginPath();
        const rNarrow = h * 0.15;
        const rWide = h * 0.6;
        ctx.moveTo(cursorX, centerY - rNarrow);
        ctx.lineTo(rightX, centerY - rWide);
        ctx.lineTo(rightX, centerY + rWide);
        ctx.lineTo(cursorX, centerY + rNarrow);
        ctx.closePath();
        ctx.clip();

        const rightGrad = ctx.createLinearGradient(cursorX, 0, rightX, 0);
        rightGrad.addColorStop(0, 'hsla(25, 55%, 45%, 0.22)');
        rightGrad.addColorStop(0.06, 'hsla(25, 50%, 42%, 0.15)');
        rightGrad.addColorStop(0.18, 'hsla(22, 42%, 38%, 0.08)');
        rightGrad.addColorStop(0.4, 'hsla(20, 35%, 35%, 0.03)');
        rightGrad.addColorStop(1, 'hsla(18, 25%, 30%, 0)');
        ctx.fillStyle = rightGrad;
        ctx.fillRect(cursorX, 0, rightX - cursorX, h);
        ctx.restore();

        // === LEFT cone: spreads from cursor toward left edge ===
        ctx.save();
        ctx.beginPath();
        const lNarrow = h * 0.12;
        const lWide = h * 0.45;
        ctx.moveTo(cursorX, centerY - lNarrow);
        ctx.lineTo(leftX, centerY - lWide);
        ctx.lineTo(leftX, centerY + lWide);
        ctx.lineTo(cursorX, centerY + lNarrow);
        ctx.closePath();
        ctx.clip();

        const leftGrad = ctx.createLinearGradient(cursorX, 0, leftX, 0);
        leftGrad.addColorStop(0, 'hsla(25, 55%, 45%, 0.18)');
        leftGrad.addColorStop(0.1, 'hsla(23, 45%, 40%, 0.10)');
        leftGrad.addColorStop(0.3, 'hsla(20, 35%, 36%, 0.04)');
        leftGrad.addColorStop(1, 'hsla(18, 25%, 30%, 0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(leftX, 0, cursorX - leftX, h);
        ctx.restore();

        // Radial warm glow at cursor origin
        const glowR = h * 1.2;
        const originGlow = ctx.createRadialGradient(cursorX, centerY, 0, cursorX, centerY, glowR);
        originGlow.addColorStop(0, 'hsla(28, 60%, 48%, 0.20)');
        originGlow.addColorStop(0.15, 'hsla(25, 50%, 42%, 0.10)');
        originGlow.addColorStop(0.4, 'hsla(22, 40%, 38%, 0.03)');
        originGlow.addColorStop(1, 'hsla(20, 30%, 32%, 0)');
        ctx.fillStyle = originGlow;
        ctx.fillRect(cursorX - glowR, 0, glowR * 2, h);

        // Vertical golden cursor line
        const cursorGrad = ctx.createLinearGradient(cursorX, h * 0.1, cursorX, h * 0.9);
        cursorGrad.addColorStop(0, 'hsla(35, 80%, 60%, 0)');
        cursorGrad.addColorStop(0.2, 'hsla(35, 90%, 65%, 0.6)');
        cursorGrad.addColorStop(0.5, 'hsla(38, 95%, 70%, 0.85)');
        cursorGrad.addColorStop(0.8, 'hsla(35, 90%, 65%, 0.6)');
        cursorGrad.addColorStop(1, 'hsla(35, 80%, 60%, 0)');

        ctx.strokeStyle = cursorGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cursorX, h * 0.1);
        ctx.lineTo(cursorX, h * 0.9);
        ctx.stroke();

        // Small glow halo around cursor
        const haloGrad = ctx.createRadialGradient(cursorX, centerY, 0, cursorX, centerY, 12);
        haloGrad.addColorStop(0, 'hsla(35, 85%, 68%, 0.16)');
        haloGrad.addColorStop(0.5, 'hsla(35, 75%, 60%, 0.04)');
        haloGrad.addColorStop(1, 'hsla(35, 65%, 55%, 0)');
        ctx.fillStyle = haloGrad;
        ctx.fillRect(cursorX - 12, 0, 24, h);

        // Sparse tiny sparkles
        spawnParticles(cursorX, rightX - cursorX, h);

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
