import { useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Lock, Trophy } from 'lucide-react';
import type { Ctx } from '../lib/types';
import { achievementsFor } from '../lib/data';
import { fmtDate, fmtDur } from '../lib/format';
import { Bar, Card } from './ui';
import { cn } from '../utils/cn';
import { buzz } from '../lib/hooks';

export function Medals({ ctx }: { ctx: Ctx }) {
  const list = useMemo(() => achievementsFor(ctx.s, ctx.e), [ctx.s, ctx.e]);
  const got = list.filter((a) => a.ts <= ctx.now);
  const next = list.find((a) => a.ts > ctx.now);
  const prev = got[got.length - 1];
  const segPct = next ? (ctx.now - (prev?.ts ?? ctx.s)) / (next.ts - (prev?.ts ?? ctx.s)) : 1;

  const celebrate = (x: number, y: number) => {
    buzz([15, 30, 15]);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    const accent2 = getComputedStyle(document.documentElement).getPropertyValue('--accent2').trim();
    confetti({ particleCount: 80, spread: 70, origin: { x, y }, colors: [accent, accent2, '#ffffff'] });
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      <Card>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-4">
            <div className="font-display text-5xl font-black lg:text-6xl">
              <span className="text-grad">{got.length}</span>
              <span className="text-2xl text-white/30">/{list.length}</span>
            </div>
            <div className="max-w-44 text-sm text-white/55">медалей получено. Все выдаются автоматически — просто держись.</div>
          </div>
          <div className="min-w-48 flex-1">
            <Bar pct={list.length ? got.length / list.length : 0} shimmer className="h-2.5" />
            <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-white/40">
              <span className="flex items-center gap-1">
                <Trophy size={11} className="text-accent" /> коллекция собрана на {list.length ? Math.round((got.length / list.length) * 100) : 0}%
              </span>
              <span>осталось {list.length - got.length}</span>
            </div>
          </div>
        </div>
        {next && (
          <div className="mt-4 rounded-2xl bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{next.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Следующая · {fmtDate(next.ts)}</div>
                <div className="truncate font-bold">{next.title}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-sm font-bold text-accent">{fmtDur(next.ts - ctx.now)}</div>
                <div className="text-[10px] font-semibold text-white/35">осталось ждать</div>
              </div>
            </div>
            <Bar pct={segPct} className="mt-3" />
          </div>
        )}
        <p className="mt-3 hidden text-[11px] text-white/30 lg:block">Совет: нажми на полученную медаль — будет салют 🎆</p>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-4">
        {list.map((a, i) => {
          const ok = a.ts <= ctx.now;
          const isNext = next?.id === a.id;
          return (
            <button
              type="button"
              key={a.id}
              title={ok ? `${a.title} — получена ${fmtDate(a.ts, false)}` : `${a.title} — откроется ${fmtDate(a.ts)}`}
              onClick={(ev) => {
                if (!ok) return buzz(4);
                const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                celebrate((r.left + r.width / 2) / window.innerWidth, (r.top + r.height / 2) / window.innerHeight);
              }}
              style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
              className={cn(
                'glass pop-in card-lift group relative rounded-3xl p-4 text-left transition active:scale-95 lg:p-5',
                !ok && 'opacity-55 hover:opacity-80',
                isNext && 'opacity-100 [outline:1px_solid_color-mix(in_oklab,var(--accent)_55%,transparent)]'
              )}
            >
              <div
                className={cn(
                  'mb-3 grid h-14 w-14 place-items-center rounded-2xl text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 lg:h-16 lg:w-16 lg:text-4xl',
                  ok ? 'bg-grad shadow-[0_0_24px_-4px_var(--accent)]' : 'bg-white/5 grayscale'
                )}
              >
                {a.icon}
              </div>
              {!ok && !isNext && <Lock size={14} className="absolute right-4 top-4 text-white/40" />}
              {isNext && <span className="absolute right-3 top-3 rounded-full bg-accent px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-black">след.</span>}
              <div className="font-bold leading-tight">{a.title}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-white/50">{a.desc}</div>
              <div className={cn('mt-2 text-[10px] font-bold', ok ? 'text-accent' : 'text-white/40')}>
                {ok ? `✓ ${fmtDate(a.ts, false)}` : `через ${fmtDur(a.ts - ctx.now)} · ${fmtDate(a.ts, false)}`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
