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
  gender?: 'male' | 'female';
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
  twinkleSpeed: number;
  twinklePhase: number;
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
  gender = 'male',
}: SparkleSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prefixRef = useRef<HTMLSpanElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const particleIdRef = useRef(0);
  const frameCountRef = useRef(0);

  const isMen = gender === 'male';

  // Theme colors
  const borderColor = isMen
    ? 'rgba(59, 130, 246, 0.25)'
    : 'rgba(236, 72, 153, 0.25)';
  const beamHue = isMen ? { h: 20, s: 70, l: 66 } : { h: 330, s: 80, l: 70 };
  const bloomColor = isMen
    ? 'rgba(234,142,105,0.7)'
    : 'rgba(244,114,182,0.7)';
  const textTint = isMen ? '#fff7ed' : '#fff1f2';
  const textShadowColor = isMen
    ? 'rgba(234,142,105,0.5)'
    : 'rgba(244,114,182,0.5)';
  const particleHue = isMen ? 25 : 330;

  const spawnParticles = useCallback(
    (startX: number, width: number, height: number) => {
      frameCountRef.current++;
      if (frameCountRef.current % 3 !== 0) return;
      if (particlesRef.current.length > 18) return;

      const x = startX + Math.random() * width;
      const centerY = height / 2;
      // Cone shape: particles closer to startX are near center, farther out spread more
      const progress = width > 0 ? (x - startX) / width : 0;
      const coneSpread = height * 0.1 + progress * height * 0.5;
      const y = centerY + (Math.random() - 0.5) * coneSpread;

      particlesRef.current.push({
        id: particleIdRef.current++,
        x,
        y,
        size: Math.random() * 1.2 + 0.4,
        opacity: Math.random() * 0.6 + 0.2,
        speedX: (Math.random() - 0.3) * 0.3,
        speedY: (Math.random() - 0.5) * 0.15,
        life: 0,
        maxLife: 70 + Math.random() * 80,
        twinkleSpeed: 3 + Math.random() * 5,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    },
    []
  );

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
      ctx.setTransform(1, 0, 0, 1, 0, 0);
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

      const prefixEl = prefixRef.current;
      const cursorX = prefixEl
        ? prefixEl.offsetLeft + prefixEl.offsetWidth + 6
        : 80;
      const centerY = h / 2;
      const rightX = w;

      // ========== VOLUMETRIC BEAM (RIGHT SIDE ONLY) ==========

      // 1. Origin bloom — massive soft glow at cursor
      const bloomR = h * 2.5;
      const bloom = ctx.createRadialGradient(
        cursorX, centerY, 0,
        cursorX, centerY, bloomR
      );
      bloom.addColorStop(0, `hsla(0, 0%, 100%, 0.35)`);
      bloom.addColorStop(0.03, `hsla(${beamHue.h}, ${beamHue.s}%, ${beamHue.l}%, 0.30)`);
      bloom.addColorStop(0.08, `hsla(${beamHue.h}, ${beamHue.s - 10}%, ${beamHue.l - 5}%, 0.18)`);
      bloom.addColorStop(0.2, `hsla(${beamHue.h}, ${beamHue.s - 20}%, ${beamHue.l - 10}%, 0.06)`);
      bloom.addColorStop(0.5, `hsla(${beamHue.h}, ${beamHue.s - 30}%, ${beamHue.l - 15}%, 0.01)`);
      bloom.addColorStop(1, 'hsla(0, 0%, 0%, 0)');

      // Clip bloom to right side only
      ctx.save();
      ctx.beginPath();
      ctx.rect(cursorX - 20, 0, w, h);
      ctx.clip();
      ctx.fillStyle = bloom;
      ctx.fillRect(cursorX - bloomR, centerY - bloomR, bloomR * 2, bloomR * 2);
      ctx.restore();

      // 2. Conical beam — starts at cursor, widens to right
      ctx.save();
      ctx.beginPath();
      const coneNarrowHalf = h * 0.06;
      const coneWideHalf = h * 0.65;
      ctx.moveTo(cursorX, centerY - coneNarrowHalf);
      ctx.lineTo(rightX, centerY - coneWideHalf);
      ctx.lineTo(rightX, centerY + coneWideHalf);
      ctx.lineTo(cursorX, centerY + coneNarrowHalf);
      ctx.closePath();
      ctx.clip();

      // Horizontal fade gradient inside cone
      const beamGrad = ctx.createLinearGradient(cursorX, 0, rightX, 0);
      beamGrad.addColorStop(0, `hsla(${beamHue.h}, ${beamHue.s}%, ${beamHue.l}%, 0.50)`);
      beamGrad.addColorStop(0.04, `hsla(${beamHue.h}, ${beamHue.s}%, ${beamHue.l}%, 0.38)`);
      beamGrad.addColorStop(0.12, `hsla(${beamHue.h}, ${beamHue.s - 5}%, ${beamHue.l - 3}%, 0.22)`);
      beamGrad.addColorStop(0.3, `hsla(${beamHue.h}, ${beamHue.s - 15}%, ${beamHue.l - 8}%, 0.10)`);
      beamGrad.addColorStop(0.55, `hsla(${beamHue.h}, ${beamHue.s - 25}%, ${beamHue.l - 12}%, 0.03)`);
      beamGrad.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(cursorX, 0, rightX - cursorX, h);

      // Radial mask within cone for natural spread
      const radialMask = ctx.createRadialGradient(
        cursorX, centerY, 0,
        cursorX, centerY, (rightX - cursorX) * 0.8
      );
      radialMask.addColorStop(0, `hsla(0, 0%, 100%, 0.15)`);
      radialMask.addColorStop(0.3, `hsla(${beamHue.h}, ${beamHue.s - 10}%, ${beamHue.l}%, 0.08)`);
      radialMask.addColorStop(0.7, `hsla(${beamHue.h}, ${beamHue.s - 20}%, ${beamHue.l - 5}%, 0.02)`);
      radialMask.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
      ctx.fillStyle = radialMask;
      ctx.fillRect(cursorX, 0, rightX - cursorX, h);

      ctx.restore();

      // 3. Smoky volumetric scatter near origin
      ctx.save();
      ctx.beginPath();
      ctx.rect(cursorX, 0, w, h);
      ctx.clip();
      const smokeR = h * 1.8;
      const smoke = ctx.createRadialGradient(
        cursorX + 10, centerY, 0,
        cursorX + 10, centerY, smokeR
      );
      smoke.addColorStop(0, `hsla(${beamHue.h}, 40%, 75%, 0.12)`);
      smoke.addColorStop(0.15, `hsla(${beamHue.h}, 35%, 60%, 0.06)`);
      smoke.addColorStop(0.4, `hsla(${beamHue.h}, 25%, 50%, 0.02)`);
      smoke.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
      ctx.fillStyle = smoke;
      ctx.fillRect(cursorX, centerY - smokeR, smokeR * 2, smokeR * 2);
      ctx.restore();

      // ========== CURSOR LINE (The Source) ==========

      // White-hot vertical line
      const cursorLineGrad = ctx.createLinearGradient(cursorX, h * 0.02, cursorX, h * 0.98);
      cursorLineGrad.addColorStop(0, 'hsla(0, 0%, 100%, 0)');
      cursorLineGrad.addColorStop(0.1, 'hsla(0, 0%, 100%, 0.6)');
      cursorLineGrad.addColorStop(0.3, 'hsla(0, 0%, 100%, 0.92)');
      cursorLineGrad.addColorStop(0.5, 'hsla(0, 0%, 100%, 1)');
      cursorLineGrad.addColorStop(0.7, 'hsla(0, 0%, 100%, 0.92)');
      cursorLineGrad.addColorStop(0.9, 'hsla(0, 0%, 100%, 0.6)');
      cursorLineGrad.addColorStop(1, 'hsla(0, 0%, 100%, 0)');
      ctx.strokeStyle = cursorLineGrad;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cursorX, h * 0.02);
      ctx.lineTo(cursorX, h * 0.98);
      ctx.stroke();

      // Thinner bright core
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cursorX, h * 0.12);
      ctx.lineTo(cursorX, h * 0.88);
      ctx.stroke();

      // Intense bloom around cursor line
      const cursorBloom = ctx.createRadialGradient(cursorX, centerY, 0, cursorX, centerY, 28);
      cursorBloom.addColorStop(0, 'hsla(0, 0%, 100%, 0.55)');
      cursorBloom.addColorStop(0.15, 'hsla(0, 0%, 100%, 0.30)');
      cursorBloom.addColorStop(0.35, `hsla(${beamHue.h}, ${beamHue.s}%, ${beamHue.l}%, 0.18)`);
      cursorBloom.addColorStop(0.65, `hsla(${beamHue.h}, ${beamHue.s - 15}%, ${beamHue.l - 5}%, 0.06)`);
      cursorBloom.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
      ctx.fillStyle = cursorBloom;
      ctx.fillRect(cursorX - 28, 0, 56, h);

      // ========== PARTICLES ==========
      spawnParticles(cursorX + 5, rightX - cursorX - 10, h);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++;
        if (p.life > p.maxLife) return false;

        p.x += p.speedX;
        p.y += p.speedY;

        const lifeRatio = p.life / p.maxLife;
        const fadeIn = Math.min(lifeRatio * 5, 1);
        const fadeOut = lifeRatio > 0.55 ? 1 - (lifeRatio - 0.55) / 0.45 : 1;
        const twinkle =
          0.5 + 0.5 * Math.sin(p.life * p.twinkleSpeed * 0.1 + p.twinklePhase);
        const alpha = p.opacity * fadeIn * fadeOut * twinkle;

        // White micro-dot with warm tint
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particleHue}, 20%, 95%, ${alpha})`;
        ctx.fill();

        // Tiny glow around each particle
        if (alpha > 0.15) {
          const pGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          pGlow.addColorStop(0, `hsla(${particleHue}, 30%, 90%, ${alpha * 0.4})`);
          pGlow.addColorStop(1, `hsla(${particleHue}, 30%, 80%, 0)`);
          ctx.fillStyle = pGlow;
          ctx.fillRect(p.x - p.size * 3, p.y - p.size * 3, p.size * 6, p.size * 6);
        }

        return true;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
    };
  }, [gender, spawnParticles]);

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
        'relative flex items-center gap-3 rounded-full px-5 overflow-hidden cursor-text',
        'h-[56px] md:h-[64px]',
        'transition-all duration-500',
        className
      )}
      style={{
        background: '#121214',
        border: `1.5px solid ${borderColor}`,
        boxShadow: `inset 0 0.5px 0 0 rgba(255,255,255,0.08), 0 30px 70px -15px rgba(0,0,0,0.85)`,
      }}
    >
      {/* Canvas for beam & particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Search icon */}
      <Search
        size={17}
        className="relative z-[2] flex-shrink-0 transition-colors duration-500"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      />

      {/* Prefix text */}
      <span
        ref={prefixRef}
        className="relative z-[2] text-[15px] italic flex-shrink-0 select-none transition-colors duration-500"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        {prefix}
      </span>

      {/* Input / ReadOnly text */}
      {readOnly ? (
        <span
          className="relative z-[2] text-[15px] italic flex-1 transition-colors duration-500"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
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
          className="relative z-[2] flex-1 bg-transparent text-[15px] italic outline-none min-w-0 transition-colors duration-500"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: textTint,
            textShadow: value ? `0 0 8px ${textShadowColor}` : 'none',
            caretColor: 'transparent',
          }}
        />
      )}

      {/* CSS cursor bloom overlay — the intense glow behind the canvas cursor */}
      <div
        className="absolute z-[0] pointer-events-none rounded-full transition-all duration-500"
        style={{
          width: 110,
          height: 110,
          left: (prefixRef.current?.offsetLeft ?? 60) + (prefixRef.current?.offsetWidth ?? 20) + 6 - 55,
          top: '50%',
          transform: 'translateY(-50%)',
          background: bloomColor,
          filter: 'blur(55px)',
          opacity: 0.4,
        }}
      />
    </div>
  );
};

export default SparkleSearchBar;
