import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

export function Card({ children, className, onClick, delay = 0 }: { children: ReactNode; className?: string; onClick?: () => void; delay?: number }) {
  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        'glass pop-in card-lift rounded-3xl p-5',
        onClick && 'cursor-pointer active:scale-[0.985] transition-transform',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
        <span className="bg-grad inline-block h-3.5 w-1 rounded-full" aria-hidden />
        {children}
      </h3>
      {right}
    </div>
  );
}

/** тонкая полоса прогресса с градиентом темы */
export function Bar({ pct, className, shimmer = false }: { pct: number; className?: string; shimmer?: boolean }) {
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-white/10', className)} role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="bg-grad relative h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%` }}>
        {shimmer && <div className="shimmer absolute inset-0" />}
      </div>
    </div>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70', className)}>
      {children}
    </span>
  );
}

export function IconBtn({
  children,
  onClick,
  label,
  className,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title ?? label}
      className={cn(
        'glass hover-zoom grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white/80 transition-colors hover:border-white/20 hover:text-white active:scale-95',
        className
      )}
    >
      {children}
    </button>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** широкая десктопная модалка (настройки, шаринг) */
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', k);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fade absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'sheet-up relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-[var(--card)] shadow-2xl sm:rounded-[2rem]',
          wide ? 'max-w-3xl' : 'max-w-lg'
        )}
      >
        <div className="shrink-0 px-5 pt-5 sm:px-7 sm:pt-6">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15 sm:hidden" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold sm:text-xl">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              title="Закрыть (Esc)"
              className="hover-zoom grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 pb-8 sm:px-7 safe-bottom">{children}</div>
      </div>
    </div>
  );
}

export function ProgressRing({
  pct,
  children,
  size = 300,
  stroke = 16,
  className,
}: {
  pct: number;
  children?: ReactNode;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2 - 6;
  const c = 2 * Math.PI * r;
  const inner = r - stroke - 2;
  const ic = 2 * Math.PI * inner;
  const ang = pct * Math.PI * 2 - Math.PI / 2;
  const kx = size / 2 + r * Math.cos(ang);
  const ky = size / 2 + r * Math.sin(ang);
  return (
    <div className={cn('relative mx-auto aspect-square w-full max-w-[320px]', className)}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={inner}
          fill="none"
          stroke="rgba(255,255,255,.14)"
          strokeWidth={6}
          strokeDasharray={`1.2 ${ic / 100 - 1.2}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={inner}
          fill="none"
          stroke="var(--accent)"
          strokeOpacity={0.9}
          strokeWidth={6}
          strokeDasharray={`1.2 ${ic / 100 - 1.2}`}
          style={{ clipPath: 'none' }}
          strokeDashoffset={0}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          mask="url(#tickMask)"
        />
        <mask id="tickMask">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={inner}
            fill="none"
            stroke="white"
            strokeWidth={8}
            strokeDasharray={`${ic * pct} ${ic}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </mask>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0.002, pct))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 10px color-mix(in oklab, var(--accent) 60%, transparent))' }}
        />
        <circle cx={kx} cy={ky} r={stroke / 2 + 3} fill="#fff" style={{ filter: 'drop-shadow(0 0 8px var(--accent))' }} />
        <circle cx={kx} cy={ky} r={stroke / 2 - 3} fill="var(--accent)" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Pogon({ stripes, gold, className }: { stripes: number; gold?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 60 110" className={className}>
      <path
        d="M6 26 L30 4 L54 26 V104 Q54 108 50 108 H10 Q6 108 6 104 Z"
        style={{ fill: 'color-mix(in oklab, var(--accent) 22%, #0b0b0b)', stroke: 'var(--accent)', strokeOpacity: 0.6 }}
        strokeWidth="2"
      />
      <circle cx="30" cy="22" r="4.5" style={{ fill: 'var(--accent2)' }} />
      {gold ? (
        <>
          <rect x="8" y="36" width="44" height="66" style={{ fill: 'var(--accent2)', opacity: 0.9 }} />
          <path d="M30 52l5 10 11 1.6-8 7.8 2 11L30 77l-10 5.4 2-11-8-7.8 11-1.6z" style={{ fill: '#111' }} />
        </>
      ) : (
        Array.from({ length: stripes }).map((_, i) => (
          <rect key={i} x="8" y={92 - i * 12} width="44" height="7" rx="1" style={{ fill: 'var(--accent2)' }} />
        ))
      )}
    </svg>
  );
}

export function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent bg-white/5 px-4 py-3 text-left transition-colors hover:border-white/10 hover:bg-white/[0.07] active:scale-[0.99]"
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-white/45">{hint}</span>}
      </span>
      <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', on ? 'bg-accent shadow-[0_0_14px_-2px_var(--accent)]' : 'bg-white/15')}>
        <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200', on ? 'left-6' : 'left-1')} />
      </span>
    </button>
  );
}
