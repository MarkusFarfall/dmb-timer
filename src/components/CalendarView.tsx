import { useEffect, useMemo, useRef, useState } from 'react';
import { NotebookPen, Crosshair, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import type { Ctx } from '../lib/types';
import { DAY, dayKey, startOfDay } from '../lib/time';
import { num, fmtDate } from '../lib/format';
import { Bar, Card, Sheet } from './ui';
import { cn } from '../utils/cn';
import { buzz } from '../lib/hooks';

const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function CalendarView({ ctx, notes, setNotes }: { ctx: Ctx; notes: Record<string, string>; setNotes: (n: Record<string, string>) => void }) {
  const { s, e, now } = ctx;
  const todayRef = useRef<HTMLButtonElement>(null);
  const [sel, setSel] = useState<number | null>(null);
  const todayStart = startOfDay(now);
  const dayKeyNow = Math.floor(now / DAY);

  const months = useMemo(() => {
    const out: { y: number; m: number }[] = [];
    const d = new Date(s);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    let guard = 0;
    while (d.getTime() <= e && guard < 80) {
      out.push({ y: d.getFullYear(), m: d.getMonth() });
      d.setMonth(d.getMonth() + 1);
      guard++;
    }
    return out;
  }, [s, e]);

  const scrollToToday = (smooth = true) => todayRef.current?.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });

  useEffect(() => {
    const t = setTimeout(() => scrollToToday(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sStart = startOfDay(s);
  const eStart = startOfDay(e);
  const totalDays = Math.round((eStart - sStart) / DAY) + 1;
  const crossed = Math.max(0, Math.min(totalDays, Math.round((todayStart - sStart) / DAY)));
  const noteCount = Object.values(notes).filter(Boolean).length;

  const grid = useMemo(
    () =>
      months.map(({ y, m }) => {
        const first = new Date(y, m, 1);
        const offset = (first.getDay() + 6) % 7;
        const daysIn = new Date(y, m + 1, 0).getDate();
        const cells: (number | null)[] = Array(offset).fill(null);
        for (let i = 1; i <= daysIn; i++) cells.push(new Date(y, m, i).getTime());
        const inService = cells.filter((ts) => ts !== null && ts >= sStart && ts <= eStart).length;
        const doneInMonth = cells.filter((ts) => ts !== null && ts >= sStart && ts <= eStart && ts < todayStart).length;
        return { y, m, cells, inService, doneInMonth, title: first.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) };
      }),
    [months, sStart, eStart, todayStart]
  );

  return (
    <div className="space-y-4 lg:space-y-5">
      <Card>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div>
            <div className="font-display text-3xl font-black lg:text-4xl">
              <span className="text-grad">{num(crossed)}</span>
              <span className="text-white/30"> / {num(totalDays)}</span>
            </div>
            <div className="text-sm text-white/50">дней вычеркнуто</div>
          </div>
          <div className="min-w-44 flex-1">
            <Bar pct={totalDays ? crossed / totalDays : 0} shimmer className="h-2.5" />
            <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-white/40">
              <span>{totalDays ? ((crossed / totalDays) * 100).toFixed(1) : 0}% календаря позади</span>
              <span>осталось {num(totalDays - crossed)} дн</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 font-mono text-xl font-bold">
                <NotebookPen size={16} className="text-accent" /> {noteCount}
              </div>
              <div className="text-xs text-white/40">записей в дневнике</div>
            </div>
            <button
              type="button"
              onClick={() => scrollToToday()}
              className="hover-zoom inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3.5 py-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            >
              <Crosshair size={14} className="text-accent" /> Сегодня
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/[0.06] pt-3 text-[11px] font-semibold text-white/40">
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-accent" /> прожито</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-white" /> сегодня</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-white/10" /> впереди</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-1.5 w-1.5 rounded-full bg-accent2" /> есть запись</span>
          <span>🏁 день дембеля</span>
          <span className="ml-auto hidden lg:inline">Наведи на день — увидишь дату, клик — запись в дневнике</span>
        </div>
      </Card>

      <div className="grid items-start gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-3">
        {grid.map((mo, mi) => (
          <Card key={`${mo.y}-${mo.m}`} delay={Math.min(mi, 6) * 40} className="p-4 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <div className="font-display text-base font-bold capitalize">{mo.title}</div>
              {mo.inService > 0 && (
                <div className="text-[11px] font-semibold text-white/35">
                  {mo.doneInMonth}/{mo.inService} дн
                </div>
              )}
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {WD.map((w, wi) => (
                <div key={w} className={cn('text-[10px] font-bold uppercase', wi >= 5 ? 'text-accent2/60' : 'text-white/30')}>
                  {w}
                </div>
              ))}
              {mo.cells.map((ts, i) => {
                if (ts === null) return <div key={i} />;
                const inRange = ts >= sStart && ts <= eStart;
                const isToday = ts === todayStart;
                const past = ts < todayStart;
                const note = notes[dayKey(ts)];
                const hasNote = !!note;
                const isEnd = ts === eStart;
                const isStart = ts === sStart;
                const wd = new Date(ts).getDay();
                const weekend = wd === 0 || wd === 6;
                const dayN = Math.round((ts - sStart) / DAY) + 1;
                return (
                  <button
                    type="button"
                    key={i}
                    ref={isToday ? todayRef : undefined}
                    disabled={!inRange}
                    title={
                      inRange
                        ? `${fmtDate(ts, false)} · день ${dayN}${hasNote ? ` · 📝 ${note.slice(0, 60)}${note.length > 60 ? '…' : ''}` : ''}`
                        : fmtDate(ts, false)
                    }
                    aria-label={inRange ? `${fmtDate(ts, false)}, день службы ${dayN}${hasNote ? ', есть запись' : ''}` : undefined}
                    onClick={() => {
                      if (!inRange) return;
                      buzz();
                      setSel(ts);
                    }}
                    className={cn(
                      'relative grid aspect-square place-items-center rounded-xl text-sm font-bold transition-all',
                      !inRange && 'cursor-default text-white/15',
                      inRange && past && 'crossed cursor-pointer bg-accent text-black/70 hover:brightness-110',
                      inRange && !past && !isToday && 'cursor-pointer bg-white/5 text-white/80 hover:scale-[1.08] hover:bg-white/12 hover:text-white',
                      inRange && !past && weekend && !isToday && 'text-accent2/90',
                      isToday && 'pulse-ring cursor-pointer bg-white text-black hover:scale-[1.08]',
                      isEnd && !past && 'bg-grad text-black'
                    )}
                  >
                    {isEnd ? '🏁' : isStart && !past ? '🎖️' : new Date(ts).getDate()}
                    {hasNote && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent2 ring-1 ring-black/40" />}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <DaySheet ctx={ctx} ts={sel} onClose={() => setSel(null)} onNavigate={setSel} notes={notes} setNotes={setNotes} key={sel ?? 0} tick={dayKeyNow} />
    </div>
  );
}

function DaySheet({
  ctx,
  ts,
  onClose,
  onNavigate,
  notes,
  setNotes,
}: {
  ctx: Ctx;
  ts: number | null;
  onClose: () => void;
  onNavigate: (ts: number) => void;
  notes: Record<string, string>;
  setNotes: (n: Record<string, string>) => void;
  tick: number;
}) {
  const k = ts ? dayKey(ts) : '';
  const [text, setText] = useState(notes[k] ?? '');
  if (!ts) return null;
  const sStart = startOfDay(ctx.s);
  const eStart = startOfDay(ctx.e);
  const dayN = Math.round((ts - sStart) / DAY) + 1;
  const leftD = Math.round((eStart - ts) / DAY);
  const pctAtDay = Math.min(100, Math.max(0, ((ts - ctx.s) / (ctx.e - ctx.s)) * 100));
  const hadNote = !!notes[k];

  const apply = (value: string) => {
    const n = { ...notes };
    if (value.trim()) n[k] = value.trim();
    else delete n[k];
    setNotes(n);
  };
  const save = () => {
    apply(text);
    buzz([10, 40, 10]);
    onClose();
  };
  const nav = (dir: 1 | -1) => {
    const next = ts + dir * DAY;
    if (next < sStart || next > eStart) return;
    if (text !== (notes[k] ?? '')) apply(text);
    buzz(6);
    onNavigate(next);
  };

  return (
    <Sheet open={!!ts} onClose={onClose} title={fmtDate(ts, false)}>
      <div className="-mt-2 mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold capitalize text-white/40">{new Date(ts).toLocaleDateString('ru-RU', { weekday: 'long' })}</span>
        <span className="flex gap-1.5">
          <button
            type="button"
            onClick={() => nav(-1)}
            disabled={ts <= sStart}
            aria-label="Предыдущий день"
            title="Предыдущий день"
            className="hover-zoom grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => nav(1)}
            disabled={ts >= eStart}
            aria-label="Следующий день"
            title="Следующий день"
            className="hover-zoom grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5"
          >
            <ChevronRight size={16} />
          </button>
        </span>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="font-mono text-2xl font-extrabold tabular text-grad">{dayN}</div>
          <div className="text-[11px] font-bold uppercase text-white/40">день по счёту</div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="font-mono text-2xl font-extrabold tabular">{leftD}</div>
          <div className="text-[11px] font-bold uppercase text-white/40">дней до конца</div>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <div className="font-mono text-2xl font-extrabold tabular">{pctAtDay.toFixed(1)}%</div>
          <div className="text-[11px] font-bold uppercase text-white/40">срока к дате</div>
        </div>
      </div>
      <Bar pct={pctAtDay / 100} className="mb-4" />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
        }}
        rows={5}
        autoFocus
        placeholder="Что было в этот день? Наряд, письмо из дома, звонок, смешной случай…"
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none transition placeholder:text-white/25 focus:border-accent focus:bg-white/[0.07]"
      />
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/30">
        <span>{text.trim() ? `${text.trim().length} символов` : 'Пустая запись не сохраняется'}</span>
        <span className="hidden items-center gap-1 lg:flex">
          <span className="kbd">Ctrl</span>+<span className="kbd">↵</span> сохранить
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        {hadNote && (
          <button
            type="button"
            onClick={() => {
              apply('');
              buzz([10, 40, 10]);
              onClose();
            }}
            aria-label="Удалить запись"
            title="Удалить запись"
            className="hover-zoom grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button type="button" onClick={save} className="bg-grad glow hover-zoom h-12 flex-1 rounded-2xl font-display font-bold text-black transition active:scale-[0.98]">
          Сохранить в дневник
        </button>
      </div>
    </Sheet>
  );
}
