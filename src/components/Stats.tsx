import { useMemo, useState } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import type { Ctx } from '../lib/types';
import { calc, countDaily, countWeekday, monthsBetween, DAY, HOUR, MIN, WEEK, SEC, parseLocal, toLocalInput } from '../lib/time';
import { num, fmtDate, fmtDur, plural, W } from '../lib/format';
import { LABELS, rankOf } from '../lib/data';
import { Card, SectionTitle } from './ui';
import { inputCls } from './ProfileForm';
import { cn } from '../utils/cn';

function UnitsTable({ ctx }: { ctx: Ctx }) {
  const c = calc(ctx.s, ctx.e, ctx.now);
  const L = LABELS;
  const mp = monthsBetween(ctx.s, Math.min(ctx.now, ctx.e));
  const ml = monthsBetween(Math.max(ctx.now, ctx.s), ctx.e);
  const rows = [
    { u: 'Месяцев', a: mp.months, b: ml.months },
    { u: 'Недель', a: c.passed / WEEK, b: c.left / WEEK },
    { u: 'Дней', a: c.passed / DAY, b: c.left / DAY },
    { u: 'Часов', a: c.passed / HOUR, b: c.left / HOUR },
    { u: 'Минут', a: c.passed / MIN, b: c.left / MIN },
    { u: 'Секунд', a: c.passed / SEC, b: c.left / SEC },
  ];
  return (
    <Card className="h-full">
      <SectionTitle>В цифрах</SectionTitle>
      <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 px-2 text-sm">
        <div />
        <div className="text-right text-[11px] font-bold uppercase tracking-wider text-accent">{L.passed}</div>
        <div className="text-right text-[11px] font-bold uppercase tracking-wider text-white/50">{L.left}</div>
      </div>
      <div className="mt-1">
        {rows.map((r) => {
          const total = r.a + r.b;
          const share = total > 0 ? r.a / total : 0;
          return (
            <div key={r.u} className="rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.04]">
              <div className="grid grid-cols-[auto_1fr_1fr] items-baseline gap-x-3 text-sm">
                <div className="font-semibold text-white/60">{r.u}</div>
                <div className="text-right font-mono font-bold tabular">{num(r.a)}</div>
                <div className="text-right font-mono font-bold tabular text-white/80">{num(r.b)}</div>
              </div>
              <div className="mt-1.5 flex h-1 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden>
                <div className="bg-grad h-full rounded-full transition-[width] duration-700" style={{ width: `${share * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 px-2 text-[11px] text-white/35">Полоса — доля пройденного. Секунды бегут быстрее всего.</p>
    </Card>
  );
}

function FunStats({ ctx }: { ctx: Ctx }) {
  const minuteKey = Math.floor(ctx.now / MIN);
  const data = useMemo(() => {
    const from = Math.max(ctx.now, ctx.s);
    const to = ctx.e;
    const pFrom = ctx.s;
    const pTo = Math.min(ctx.now, ctx.e);
    const left = Math.max(0, to - from);
    const breakfasts = countDaily(from, to, 7);
    const lunches = countDaily(from, to, 13, 30);
    const dinners = countDaily(from, to, 19);
    const eaten = countDaily(pFrom, pTo, 7) + countDaily(pFrom, pTo, 13, 30) + countDaily(pFrom, pTo, 19);
    return [
        { i: '🍳', t: 'Завтраков', v: breakfasts },
        { i: '🍲', t: 'Обедов', v: lunches },
        { i: '🍽️', t: 'Ужинов', v: dinners },
        { i: '⏰', t: 'Подъёмов', v: countDaily(from, to, 6) },
        { i: '🌙', t: 'Отбоев', v: countDaily(from, to, 22) },
        { i: '🧹', t: 'ПХД (суббот)', v: countWeekday(from, to, 6) },
        { i: '😴', t: 'Воскресений', v: countWeekday(from, to, 0) },
        { i: '😩', t: 'Понедельников', v: countWeekday(from, to, 1) },
        { i: '🪒', t: 'Бритьё', v: Math.ceil(left / DAY) },
        { i: '🪡', t: 'Подшив воротничка', v: Math.ceil(left / DAY) },
        { i: '🥣', t: 'Уже съедено в столовой', v: eaten, passed: true },
        { i: '❤️', t: 'Ударов сердца', v: (left / MIN) * 72 },
      
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minuteKey, ctx.s, ctx.e]);

  return (
    <Card delay={60} className="h-full">
      <SectionTitle>Дембельская арифметика</SectionTitle>
      <p className="-mt-1 mb-3 text-xs text-white/40">Сколько ещё осталось — с учётом текущего часа</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {data.map((d) => (
          <div key={d.t} className={cn('rounded-2xl p-3 transition-all hover:-translate-y-0.5', d.passed ? 'bg-accent/10 hover:bg-accent/15' : 'bg-white/5 hover:bg-white/[0.08]')}>
            <div className="flex items-center justify-between">
              <span className="text-xl">{d.i}</span>
              <span className={cn('font-mono text-lg font-extrabold tabular', d.passed && 'text-accent')}>{num(d.v)}</span>
            </div>
            <div className="mt-1 text-[11px] font-semibold leading-tight text-white/50">{d.t}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const MILESTONES = [10, 20, 25, 100 / 3, 50, 200 / 3, 75, 80, 90, 95, 99, 99.9];

function Milestones({ ctx }: { ctx: Ctx }) {
  const T = ctx.e - ctx.s;
  const nextIdx = MILESTONES.findIndex((m) => ctx.s + (T * m) / 100 > ctx.now);
  return (
    <Card delay={120} className="h-full">
      <SectionTitle>Когда будет X%</SectionTitle>
      <div className="relative space-y-1.5">
        <div className="absolute bottom-4 left-[13px] top-4 w-px bg-white/[0.08]" aria-hidden />
        {MILESTONES.map((m, i) => {
          const ts = ctx.s + (T * m) / 100;
          const done = ts <= ctx.now;
          const isNext = i === nextIdx;
          return (
            <div
              key={m}
              className={cn(
                'relative flex items-center gap-3 rounded-xl py-2 pl-1 pr-3 transition-colors',
                isNext ? 'bg-accent/10 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_35%,transparent)]' : done ? 'hover:bg-white/[0.03]' : 'hover:bg-white/[0.03]'
              )}
            >
              <span
                className={cn(
                  'relative z-10 grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border text-[9px]',
                  done ? 'border-accent bg-accent text-black' : isNext ? 'pulse-ring border-accent bg-[var(--card)]' : 'border-white/15 bg-[var(--card)]'
                )}
                aria-hidden
              >
                {done ? <CheckCircle2 size={14} /> : <span className={cn('h-1.5 w-1.5 rounded-full', isNext ? 'bg-accent' : 'bg-white/25')} />}
              </span>
              <div className={cn('w-14 shrink-0 font-mono text-sm font-extrabold', done ? 'text-accent' : 'text-white')}>
                {Number.isInteger(m) ? m : m.toFixed(1)}%
              </div>
              <div className="min-w-0 flex-1 truncate text-xs text-white/60">{fmtDate(ts)}</div>
              {isNext && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-black">след.</span>}
              {!done && <span className="shrink-0 font-mono text-[11px] font-bold text-white/50">{fmtDur(ts - ctx.now)}</span>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TimeMachine({ ctx }: { ctx: Ctx }) {
  const [v, setV] = useState(() => toLocalInput(ctx.now + 30 * DAY));
  const ts = parseLocal(v);
  const ok = !isNaN(ts);
  const c = calc(ctx.s, ctx.e, ok ? ts : ctx.now);
  const L = LABELS;
  const presets = [
    { l: 'Новый год', ts: new Date(new Date(ctx.now).getFullYear() + 1, 0, 1).getTime() },
    { l: '+1 неделя', ts: ctx.now + WEEK },
    { l: '+1 месяц', ts: ctx.now + 30 * DAY },
    { l: '+100 дней', ts: ctx.now + 100 * DAY },
    { l: 'День ДМБ', ts: ctx.e },
  ];
  return (
    <Card delay={180} className="h-full">
      <SectionTitle>
        <span className="flex items-center gap-1.5">
          <Clock size={12} /> Машина времени
        </span>
      </SectionTitle>
      <p className="-mt-1 mb-3 text-xs text-white/40">Выбери любой момент — узнаешь, как будет обстоять дело</p>
      <input type="datetime-local" value={v} onChange={(e) => setV(e.target.value)} className={inputCls} aria-label="Момент времени" />
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-0.5">
        {presets.map((p) => (
          <button
            key={p.l}
            type="button"
            onClick={() => setV(toLocalInput(p.ts))}
            className={cn(
              'hover-zoom shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
              ok && ts === p.ts ? 'bg-accent text-black' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            {p.l}
          </button>
        ))}
      </div>
      {ok && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/5 p-3">
              <div className="font-mono text-xl font-extrabold tabular text-grad">{(c.pct * 100).toFixed(1)}%</div>
              <div className="text-[10px] font-bold uppercase text-white/40">{L.passed}</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <div className="font-mono text-xl font-extrabold tabular">{num(c.left / DAY)}</div>
              <div className="text-[10px] font-bold uppercase text-white/40">{plural(c.left / DAY, W.day)} ост.</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-3">
              <div className="truncate font-display text-sm font-extrabold leading-7 text-accent">{rankOf(c.pct).rank.name}</div>
              <div className="text-[10px] font-bold uppercase text-white/40">звание</div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-white/40">
            {fmtDate(ts)} · {ts >= ctx.now ? `через ${fmtDur(ts - ctx.now)}` : `${fmtDur(ctx.now - ts)} назад`}
          </p>
        </>
      )}
    </Card>
  );
}

export function Stats({ ctx }: { ctx: Ctx }) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-5">
      <UnitsTable ctx={ctx} />
      <FunStats ctx={ctx} />
      <Milestones ctx={ctx} />
      <TimeMachine ctx={ctx} />
    </div>
  );
}
