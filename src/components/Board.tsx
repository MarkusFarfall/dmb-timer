import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Maximize, Minimize } from 'lucide-react';
import type { Ctx } from '../lib/types';
import { calc, split, HOUR } from '../lib/time';
import { pad, plural, W, num, fmtDate } from '../lib/format';
import { LABELS, rankOf } from '../lib/data';
import { useRafNow } from '../lib/hooks';
import { cn } from '../utils/cn';

type WakeLockSentinelLike = { release: () => Promise<void> };

const STYLES = ['Дни и время', 'Часы', 'Процент'];

export function Board({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  const now = useRafNow(true, 30);
  const [style, setStyle] = useState(0);
  const [chrome, setChrome] = useState(true); // видимость кнопок и подсказок
  const [isFs, setIsFs] = useState(false);
  const idleRef = useRef<number | undefined>(undefined);
  const c = calc(ctx.s, ctx.e, now);
  const t = split(c.notStarted ? ctx.s - now : c.left);
  const L = LABELS;
  const { rank } = rankOf(c.pct);

  useEffect(() => {
    let lock: WakeLockSentinelLike | null = null;
    const nav = navigator as unknown as { wakeLock?: { request: (t: string) => Promise<WakeLockSentinelLike> } };
    nav.wakeLock
      ?.request('screen')
      .then((l) => (lock = l))
      .catch(() => {});
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      lock?.release().catch(() => {});
      document.removeEventListener('fullscreenchange', onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const fs = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  // клавиатура: Esc — выход, пробел/стрелки — вид, F — полный экран
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
      else if (ev.key === ' ' || ev.key === 'ArrowRight') {
        ev.preventDefault();
        setStyle((v) => (v + 1) % STYLES.length);
      } else if (ev.key === 'ArrowLeft') setStyle((v) => (v + STYLES.length - 1) % STYLES.length);
      else if (ev.key.toLowerCase() === 'f' || ev.key.toLowerCase() === 'а') fs();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, fs]);

  // прячем интерфейс и курсор после 3 секунд без мыши
  const poke = useCallback(() => {
    setChrome(true);
    window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => setChrome(false), 3000);
  }, []);
  useEffect(() => {
    poke();
    return () => window.clearTimeout(idleRef.current);
  }, [poke]);

  return (
    <div
      className={cn('fade fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-black text-white select-none', !chrome && 'cursor-none')}
      onClick={() => setStyle((style + 1) % STYLES.length)}
      onMouseMove={poke}
    >
      {/* мягкое свечение темы за цифрами */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 50% 45%, color-mix(in oklab, var(--accent) 13%, transparent), transparent 65%), radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,.6) 100%)',
        }}
        aria-hidden
      />

      <div
        className={cn('absolute right-4 top-4 z-10 flex gap-2 transition-opacity duration-500 safe-top', chrome ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={fs} aria-label="На весь экран" title="На весь экран (F)" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95">
          {isFs ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
        <button type="button" onClick={onClose} aria-label="Закрыть табло" title="Закрыть (Esc)" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95">
          <X size={20} />
        </button>
      </div>

      <div className={cn('absolute left-5 top-5 z-10 transition-opacity duration-500 safe-top', chrome ? 'opacity-100' : 'opacity-0')} aria-hidden>
        <div className="font-display text-sm font-bold text-white/70">{ctx.profile.name || 'Боец'}</div>
        <div className="text-xs font-semibold text-accent">{rank.name} · дембель {fmtDate(ctx.e, false)}</div>
      </div>

      <div className="relative mb-4 text-xs font-bold uppercase tracking-[0.4em] text-white/40 lg:text-sm">{c.done ? L.doneTitle : L.until}</div>

      {style === 0 && (
        <div key="s0" className="page-in relative flex flex-col items-center">
          <div className="font-display text-[clamp(7rem,26vw,22rem)] font-black leading-none tabular text-grad">{t.days}</div>
          <div className="mt-2 text-xl font-bold text-white/50 lg:text-3xl">{plural(t.days, W.day)}</div>
          <div className="mt-6 font-mono text-[clamp(2.2rem,9vw,7rem)] font-extrabold leading-none tabular">
            {pad(t.hours)}:{pad(t.minutes)}:{pad(t.seconds)}
            <span className="text-[0.45em] text-white/40">.{pad(Math.floor(t.millis / 10))}</span>
          </div>
        </div>
      )}
      {style === 1 && (
        <div key="s1" className="page-in relative flex flex-col items-center">
          <div className="font-mono text-[clamp(4rem,15vw,13rem)] font-extrabold leading-none tabular text-grad">{num(c.left / HOUR)}</div>
          <div className="mt-2 text-xl font-bold text-white/50 lg:text-3xl">{plural(c.left / HOUR, W.hour)}</div>
          <div className="mt-6 font-mono text-[clamp(2rem,8vw,6rem)] font-extrabold tabular">
            {pad(t.minutes)}:{pad(t.seconds)}.{pad(Math.floor(t.millis / 10))}
          </div>
        </div>
      )}
      {style === 2 && (
        <div key="s2" className="page-in relative flex flex-col items-center">
          <div className="font-mono text-[clamp(3.2rem,14vw,12rem)] font-extrabold leading-none tabular text-grad">{(c.pct * 100).toFixed(4)}%</div>
          <div className="mt-4 text-xl font-bold text-white/50 lg:text-2xl">срока позади</div>
          <div className="mt-8 h-4 w-[min(80vw,900px)] overflow-hidden rounded-full bg-white/10">
            <div className="bg-grad relative h-full" style={{ width: `${c.pct * 100}%` }}>
              <div className="shimmer absolute inset-0" />
            </div>
          </div>
        </div>
      )}

      {/* тонкая полоса общего прогресса внизу — во всех видах */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/[0.07]" aria-hidden>
        <div className="bg-grad h-full" style={{ width: `${c.pct * 100}%` }} />
      </div>

      <div
        className={cn('absolute bottom-6 z-10 flex flex-col items-center gap-3 transition-opacity duration-500 safe-bottom', chrome ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2" role="tablist" aria-label="Вид табло">
          {STYLES.map((name, i) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={style === i}
              title={name}
              onClick={() => setStyle(i)}
              className={cn('h-2 rounded-full transition-all', style === i ? 'w-8 bg-accent' : 'w-2 bg-white/25 hover:bg-white/50')}
            />
          ))}
        </div>
        <div className="text-center text-xs text-white/30">
          <span className="lg:hidden">нажми на экран — сменить вид · экран не погаснет</span>
          <span className="hidden items-center gap-1.5 lg:inline-flex">
            клик или <span className="kbd">␣</span> — вид · <span className="kbd">F</span> — полный экран · <span className="kbd">Esc</span> — выйти · экран не погаснет
          </span>
        </div>
      </div>
    </div>
  );
}
