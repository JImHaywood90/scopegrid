'use client';

import * as React from 'react';
import Image from 'next/image';

export type Logo = { light: string; dark?: string; alt: string };

type Props = {
  logos: Logo[];
  /** Animation duration for a full loop (bigger = slower). Default 80s. */
  speedSeconds?: number;
  /** 'left' (default) or 'right' */
  direction?: 'left' | 'right';
  /** Mask/background palette; choose the one that matches the section bg. */
  variant?: 'light' | 'dark';
  className?: string;
};

export default function LogoBeltSimple({
  logos,
  speedSeconds = 80,
  direction = 'left',
  variant = 'dark',
  className = '',
}: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(true);
  const [reduced, setReduced] = React.useState(false);

  // Reduced motion (safe in effect)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReduced(mq.matches);
    onMotion();
    mq.addEventListener?.('change', onMotion);
    return () => mq.removeEventListener?.('change', onMotion);
  }, []);

  // Pause when not visible (safe-guarded)
  React.useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { threshold: 0 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  // Duplicate for seamless loop
  const track = React.useMemo(() => [...logos, ...logos], [logos]);

  const animClass = direction === 'left' ? 'sgbelt-left' : 'sgbelt-right';
  const paused = reduced || !inView;

  // Edge mask colors (no semantic colors, so it won’t crash Tailwind)
  const maskLeft =
    variant === 'light'
      ? 'from-white via-white/70 to-transparent'
      : 'from-slate-900 via-slate-900/70 to-transparent';
  const maskRight = maskLeft; // mirror

  return (
    <div className={`relative ${className}`}>
      {/* edge masks */}
      <div className={`pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r ${maskLeft}`} />
      <div className={`pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l ${maskRight}`} />

      <div ref={ref} className="overflow-hidden">
        <div
          className={[
            'flex items-center gap-4 py-4 will-change-transform',
            paused ? 'sgbelt-paused' : animClass,
          ].join(' ')}
          style={
            reduced
              ? undefined
              : ({ ['--sgbelt-speed' as any]: `${speedSeconds}s` } as React.CSSProperties)
          }
          aria-hidden="true"
        >
          {track.map((l, i) => (
            <div
              key={`${l.alt}-${i}`}
              className="shrink-0 rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur px-3 py-2">
              <picture>
                {l.dark && <source srcSet={l.dark} media="(prefers-color-scheme: dark)" />}
                <Image
                  src={l.light}
                  alt={l.alt}
                  width={200}
                  height={80}
                  className="h-10 w-auto object-contain opacity-90"
                  priority={i < 6}
                />
              </picture>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .sgbelt-left {
          animation: sgbelt-left var(--sgbelt-speed, 80s) linear infinite;
        }
        .sgbelt-right {
          animation: sgbelt-right var(--sgbelt-speed, 80s) linear infinite;
        }
        .sgbelt-paused {
          animation-play-state: paused !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .sgbelt-left,
          .sgbelt-right {
            animation: none !important;
            transform: none !important;
          }
        }
        @keyframes sgbelt-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes sgbelt-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
