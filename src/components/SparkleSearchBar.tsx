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
        const spotlightWidth = w - spotlightStart - 16;
        const centerY = h / 2;

        // === Flashlight beam: bright at cursor, fades across full width ===
        // Radial glow centered at cursor line, spreading horizontally
        const beamRadiusX = spotlightWidth * 0.9;
        const beamRadiusY = h * 0.7;
        const beamGradient = ctx.createRadialGradient(
          spotlightStart, centerY, 0,
          spotlightStart, centerY, beamRadiusX
        );
        beamGradient.addColorStop(0, 'hsla(38, 75%, 65%, 0.18)');
        beamGradient.addColorStop(0.15, 'hsla(36, 70%, 60%, 0.12)');
        beamGradient.addColorStop(0.35, 'hsla(34, 60%, 55%, 0.06)');
        beamGradient.addColorStop(0.6, 'hsla(32, 50%, 50%, 0.025)');
        beamGradient.addColorStop(1, 'hsla(30, 40%, 45%, 0)');

        ctx.save();
        ctx.scale(1, beamRadiusY / beamRadiusX);
        ctx.fillStyle = beamGradient;
        ctx.fillRect(spotlightStart - 10, 0, spotlightWidth + 20, (h * beamRadiusX) / beamRadiusY);
        ctx.restore();

        // Horizontal light sweep (linear fade-out from left to right)
        const sweepGradient = ctx.createLinearGradient(spotlightStart, 0, spotlightStart + spotlightWidth, 0);
        sweepGradient.addColorStop(0, 'hsla(38, 80%, 68%, 0.14)');
        sweepGradient.addColorStop(0.12, 'hsla(36, 75%, 62%, 0.09)');
        sweepGradient.addColorStop(0.3, 'hsla(34, 65%, 58%, 0.05)');
        sweepGradient.addColorStop(0.55, 'hsla(32, 55%, 52%, 0.02)');
        sweepGradient.addColorStop(1, 'hsla(30, 40%, 45%, 0)');

        ctx.fillStyle = sweepGradient;
        ctx.fillRect(spotlightStart, 0, spotlightWidth, h);

        // Vertical golden cursor line
        const cursorX = spotlightStart;
        const cursorGradient = ctx.createLinearGradient(cursorX, h * 0.15, cursorX, h * 0.85);
        cursorGradient.addColorStop(0, 'hsla(40, 80%, 65%, 0)');
        cursorGradient.addColorStop(0.25, 'hsla(40, 90%, 70%, 0.7)');
        cursorGradient.addColorStop(0.5, 'hsla(40, 95%, 75%, 0.9)');
        cursorGradient.addColorStop(0.75, 'hsla(40, 90%, 70%, 0.7)');
        cursorGradient.addColorStop(1, 'hsla(40, 80%, 65%, 0)');

        ctx.strokeStyle = cursorGradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cursorX, h * 0.15);
        ctx.lineTo(cursorX, h * 0.85);
        ctx.stroke();

        // Glow halo around cursor
        const glowGradient = ctx.createRadialGradient(cursorX, centerY, 0, cursorX, centerY, 18);
        glowGradient.addColorStop(0, 'hsla(40, 90%, 72%, 0.2)');
        glowGradient.addColorStop(0.5, 'hsla(40, 85%, 68%, 0.06)');
        glowGradient.addColorStop(1, 'hsla(40, 80%, 65%, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(cursorX - 18, 0, 36, h);

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
