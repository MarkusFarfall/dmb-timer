import { Scissors } from 'lucide-react';
import type { Ctx } from '../lib/types';
import { calc, DAY } from '../lib/time';
import { fmtDate, fmtDur, num, plural, W } from '../lib/format';
import { Bar, Card, SectionTitle } from './ui';
import { cn } from '../utils/cn';

export function Tape({ ctx }: { ctx: Ctx }) {
  const c = calc(ctx.s, ctx.e, ctx.now);
  const leftDays = c.left / DAY;
  const cm = c.done ? 0 : Math.min(100, leftDays);
  const cutting = leftDays <= 100 && !c.done;
  const startCut = ctx.e - 100 * DAY;
  const whole = Math.floor(cm);
  const frac = cm - whole;
  const cutDone = 100 - cm;
  const nextCutIn = cutting ? (frac > 0 ? frac : 1) * DAY : 0;

  const tiles = [
    { label: 'Осталось ленты', value: `${cm.toFixed(2)} см`, accent: true },
    { label: 'Уже отрезано', value: c.done ? '100 см' : cutting ? `${cutDone.toFixed(2)} см` : '0 см' },
    {
      label: cutting ? 'Следующий срез через' : c.done ? 'Лента закончилась' : 'Резка начнётся',
      value: cutting ? fmtDur(nextCutIn) : c.done ? '🏆' : fmtDate(startCut, false),
    },
    { label: 'Начало сантиметра', value: fmtDate(startCut, false) },
  ];

  return (
    <div className="space-y-4 lg:space-y-5">
      <Card>
        <SectionTitle>Дембельский сантиметр</SectionTitle>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-display text-5xl font-black tabular lg:text-7xl">
              <span className="text-grad">{cm.toFixed(2)}</span>
              <span className="ml-1 text-xl text-white/40 lg:text-2xl">см</span>
            </div>
            <div className="text-sm text-white/50">осталось ленты</div>
          </div>
          <div className="float-slow grid h-16 w-16 place-items-center rounded-2xl bg-[#f2cf4a] text-black shadow-[0_12px_32px_-8px_#f2cf4a66] lg:h-20 lg:w-20">
            <Scissors size={34} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-2xl bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.07]">
              <div className={cn('truncate font-mono text-base font-extrabold tabular lg:text-lg', t.accent && 'text-grad')}>{t.value}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-white/45">{t.label}</div>
            </div>
          ))}
        </div>
        <Bar pct={cutting || c.done ? cutDone / 100 : 0} shimmer={cutting} className="mt-4 h-2.5" />
        <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-white/40">
          <span>отрезано {(cutting || c.done ? cutDone : 0).toFixed(1)}%</span>
          <span>{fmtDate(ctx.e, false)} — последний сантиметр</span>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60">
          Армейская традиция: за 100 дней до дембеля берут портновский сантиметр и каждый день отрезают по одному делению. Здесь лента режется
          плавно — <b className="text-white">с учётом часов и минут</b>.
        </p>
        {!cutting && !c.done && (
          <div className="mt-4 rounded-2xl bg-accent/10 p-4 text-sm">
            <div className="font-bold text-accent">Сантиметр пока целый 📏</div>
            <div className="mt-1 text-white/70">
              Начнёшь резать через <b>{num(Math.ceil((startCut - ctx.now) / DAY))} {plural(Math.ceil((startCut - ctx.now) / DAY), W.day)}</b> — {fmtDate(startCut)}
            </div>
          </div>
        )}
        {cutting && (
          <div className="mt-4 rounded-2xl bg-accent/10 p-4 text-sm">
            <div className="font-bold text-accent">Режем! ✂️</div>
            <div className="mt-1 text-white/70">
              {whole + (frac > 0 ? 1 : 0)}-й сантиметр отвалится через <b className="font-mono">{fmtDur(nextCutIn)}</b>
            </div>
          </div>
        )}
      </Card>

      <Card delay={80} className="p-3 sm:p-4 lg:p-5">
        <div className="grid grid-cols-10 gap-[3px] lg:gap-1 xl:[grid-template-columns:repeat(20,minmax(0,1fr))]">
          {Array.from({ length: 100 }).map((_, i) => {
            const n = i + 1;
            const fullyThere = n <= whole;
            const partial = n === whole + 1 && frac > 0;
            const cutAt = ctx.e - (n - 1) * DAY;
            return (
              <div
                key={n}
                title={
                  fullyThere
                    ? `${n} см — ещё на ленте, отрежется к ${fmtDate(cutAt, false)}`
                    : partial
                      ? `${n} см — режется прямо сейчас ✂️`
                      : `${n} см — уже отрезан`
                }
                className={cn(
                  'relative h-12 overflow-hidden rounded-[4px] transition-all duration-700 hover:z-10 hover:scale-[1.12] hover:shadow-lg lg:h-16',
                  !fullyThere && !partial && 'border border-dashed border-white/15 bg-transparent'
                )}
              >
                {(fullyThere || partial) && (
                  <div className="tape absolute inset-y-0 left-0 shadow-[inset_0_-2px_0_rgba(0,0,0,.2)]" style={{ width: partial ? `${frac * 100}%` : '100%' }} />
                )}
                <span
                  className={cn(
                    'absolute bottom-1 left-0 right-0 text-center font-mono text-[10px] font-extrabold',
                    fullyThere ? 'text-black/80' : partial ? 'text-black/70' : 'text-white/20'
                  )}
                >
                  {n}
                </span>
                {partial && <div className="absolute inset-y-0 w-0.5 bg-red-500 shadow-[0_0_6px_red]" style={{ left: `${frac * 100}%` }} />}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between px-1 text-[11px] font-semibold text-white/40">
          <span>■ жёлтое — осталось</span>
          <span className="hidden lg:inline">наведи на деление — покажет дату среза</span>
          <span>▢ пунктир — отрезано</span>
        </div>
      </Card>
    </div>
  );
}
