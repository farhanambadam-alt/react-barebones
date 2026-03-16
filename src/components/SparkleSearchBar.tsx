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
        const leftX = 0;
        const rightX = w;

        // === RIGHT cone: bright, wide spread ===
        ctx.save();
        ctx.beginPath();
        const rNarrow = h * 0.08;
        const rWide = h * 0.7;
        ctx.moveTo(cursorX, centerY - rNarrow);
        ctx.lineTo(rightX, centerY - rWide);
        ctx.lineTo(rightX, centerY + rWide);
        ctx.lineTo(cursorX, centerY + rNarrow);
        ctx.closePath();
        ctx.clip();

        const rightGrad = ctx.createLinearGradient(cursorX, 0, rightX, 0);
        rightGrad.addColorStop(0, 'hsla(25, 60%, 50%, 0.55)');
        rightGrad.addColorStop(0.05, 'hsla(25, 55%, 45%, 0.40)');
        rightGrad.addColorStop(0.15, 'hsla(22, 45%, 40%, 0.22)');
        rightGrad.addColorStop(0.35, 'hsla(20, 38%, 35%, 0.10)');
        rightGrad.addColorStop(0.6, 'hsla(18, 30%, 30%, 0.03)');
        rightGrad.addColorStop(1, 'hsla(18, 25%, 30%, 0)');
        ctx.fillStyle = rightGrad;
        ctx.fillRect(cursorX, 0, rightX - cursorX, h);
        ctx.restore();

        // === LEFT cone: subtler ===
        ctx.save();
        ctx.beginPath();
        const lNarrow = h * 0.06;
        const lWide = h * 0.5;
        ctx.moveTo(cursorX, centerY - lNarrow);
        ctx.lineTo(leftX, centerY - lWide);
        ctx.lineTo(leftX, centerY + lWide);
        ctx.lineTo(cursorX, centerY + lNarrow);
        ctx.closePath();
        ctx.clip();

        const leftGrad = ctx.createLinearGradient(cursorX, 0, leftX, 0);
        leftGrad.addColorStop(0, 'hsla(25, 55%, 48%, 0.35)');
        leftGrad.addColorStop(0.1, 'hsla(23, 45%, 42%, 0.18)');
        leftGrad.addColorStop(0.3, 'hsla(20, 35%, 36%, 0.06)');
        leftGrad.addColorStop(1, 'hsla(18, 25%, 30%, 0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(leftX, 0, cursorX - leftX, h);
        ctx.restore();

        // Bright white-warm radial glow at cursor origin
        const glowR = h * 1.5;
        const originGlow = ctx.createRadialGradient(cursorX, centerY, 0, cursorX, centerY, glowR);
        originGlow.addColorStop(0, 'hsla(30, 20%, 95%, 0.50)');
        originGlow.addColorStop(0.05, 'hsla(30, 40%, 80%, 0.35)');
        originGlow.addColorStop(0.12, 'hsla(28, 55%, 55%, 0.20)');
        originGlow.addColorStop(0.3, 'hsla(25, 50%, 45%, 0.08)');
        originGlow.addColorStop(0.6, 'hsla(22, 40%, 38%, 0.02)');
        originGlow.addColorStop(1, 'hsla(20, 30%, 32%, 0)');
        ctx.fillStyle = originGlow;
        ctx.fillRect(cursorX - glowR, 0, glowR * 2, h);

        // Bright white vertical cursor line
        const cursorGrad = ctx.createLinearGradient(cursorX, h * 0.05, cursorX, h * 0.95);
        cursorGrad.addColorStop(0, 'hsla(30, 15%, 95%, 0)');
        cursorGrad.addColorStop(0.15, 'hsla(30, 15%, 95%, 0.7)');
        cursorGrad.addColorStop(0.5, 'hsla(30, 10%, 98%, 0.95)');
        cursorGrad.addColorStop(0.85, 'hsla(30, 15%, 95%, 0.7)');
        cursorGrad.addColorStop(1, 'hsla(30, 15%, 95%, 0)');

        ctx.strokeStyle = cursorGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cursorX, h * 0.05);
        ctx.lineTo(cursorX, h * 0.95);
        ctx.stroke();

        // White glow halo around cursor
        const haloGrad = ctx.createRadialGradient(cursorX, centerY, 0, cursorX, centerY, 18);
        haloGrad.addColorStop(0, 'hsla(30, 15%, 95%, 0.40)');
        haloGrad.addColorStop(0.3, 'hsla(30, 30%, 80%, 0.15)');
        haloGrad.addColorStop(0.7, 'hsla(30, 50%, 60%, 0.04)');
        haloGrad.addColorStop(1, 'hsla(30, 50%, 50%, 0)');
        ctx.fillStyle = haloGrad;
        ctx.fillRect(cursorX - 18, 0, 36, h);

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
      <Search size={17} className="relative z-[2] text-background/60 flex-shrink-0" />

      {/* Prefix text */}
      <span
        ref={prefixRef}
        className="relative z-[2] text-[15px] font-serif italic text-background/70 flex-shrink-0 select-none"
      >
        {prefix}
      </span>

      {/* Input */}
      {readOnly ? (
        <span className="relative z-[2] text-[15px] font-serif italic text-background/35 flex-1">
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
          className="relative z-[2] flex-1 bg-transparent text-[15px] font-serif italic text-background placeholder:text-background/35 outline-none min-w-0"
        />
      )}
    </div>
  );
};

export default SparkleSearchBar;
