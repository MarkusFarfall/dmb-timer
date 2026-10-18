import { Check } from 'lucide-react';
import type { Profile } from '../lib/types';
import { THEMES } from '../lib/data';
import { addMonths, parseLocal, toLocalInput, DAY } from '../lib/time';
import { cn } from '../utils/cn';
import { buzz } from '../lib/hooks';
import { fmtDur } from '../lib/format';

const TERMS = [
  { label: '6 мес', m: 6 },
  { label: '1 год', m: 12 },
  { label: '1.5 года', m: 18 },
  { label: '2 года', m: 24 },
  { label: '3 года', m: 36 },
];

const inputCls =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base font-semibold outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-accent focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_22%,transparent)]';

export function DatesFields({ p, set }: { p: Profile; set: (p: Profile) => void }) {
  const s = parseLocal(p.start);
  const e = parseLocal(p.end);
  const valid = !isNaN(s) && !isNaN(e) && e > s;
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/50">
          Дата и время призыва
        </span>
        <input
          type="datetime-local"
          value={p.start}
          onChange={(ev) => {
            const ns = ev.target.value;
            const old = parseLocal(p.start);
            const diffMonths = Math.round((e - old) / (30.44 * DAY));
            const term = TERMS.find((t) => t.m === diffMonths);
            set({ ...p, start: ns, end: term && ns ? toLocalInput(addMonths(parseLocal(ns), term.m)) : p.end });
          }}
          className={inputCls}
        />
      </label>
      <div>
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/50">Срок службы</span>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5" role="group" aria-label="Быстрый выбор срока">
          {TERMS.map((t) => {
            const active = !isNaN(s) && toLocalInput(addMonths(s, t.m)) === p.end;
            return (
              <button
                type="button"
                key={t.m}
                aria-pressed={active}
                onClick={() => {
                  buzz();
                  if (!isNaN(s)) set({ ...p, end: toLocalInput(addMonths(s, t.m)) });
                }}
                className={cn(
                  'hover-zoom shrink-0 rounded-full px-4 py-2 text-sm font-bold transition',
                  active ? 'bg-accent text-black shadow-[0_0_16px_-4px_var(--accent)]' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/50">
          Дата и время дембеля
        </span>
        <input type="datetime-local" value={p.end} onChange={(ev) => set({ ...p, end: ev.target.value })} className={inputCls} />
      </label>
      <div className={cn('rounded-2xl px-4 py-3 text-sm transition-colors', valid ? 'bg-accent/10 text-accent' : 'bg-red-500/10 text-red-300')} role={valid ? undefined : 'alert'}>
        {valid ? <>Общий срок: <b>{fmtDur(e - s)}</b> ({Math.round((e - s) / 3600000).toLocaleString('ru-RU')} часов)</> : 'Дата окончания должна быть позже начала'}
      </div>
    </div>
  );
}

export function ThemePicker({ value, onChange }: { value: string; onChange: (id: Profile['theme']) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Тема оформления">
      {THEMES.map((t) => {
        const active = value === t.id;
        return (
          <button
            type="button"
            key={t.id}
            role="radio"
            aria-checked={active}
            onClick={() => {
              buzz();
              onChange(t.id);
            }}
            className={cn(
              'group relative overflow-hidden rounded-2xl border p-3 text-left transition-all',
              active ? 'scale-[1.03] border-white/70 shadow-[0_10px_28px_-10px_rgba(0,0,0,.8)]' : 'border-white/10 hover:scale-[1.02] hover:border-white/35'
            )}
            style={{ background: t.bg }}
          >
            <span className="mb-2.5 block h-2.5 w-full rounded-full transition-transform group-hover:scale-y-125" style={{ background: `linear-gradient(90deg, ${t.a}, ${t.b})` }} aria-hidden />
            <span className="mb-2 flex gap-1" aria-hidden>
              <span className="h-3.5 w-3.5 rounded-full ring-1 ring-white/20" style={{ background: t.a }} />
              <span className="h-3.5 w-3.5 rounded-full ring-1 ring-white/20" style={{ background: t.b }} />
            </span>
            <span className="block text-xs font-bold text-white/90">{t.name}</span>
            {active && (
              <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white text-black shadow" aria-hidden>
                <Check size={12} strokeWidth={3.5} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { inputCls };
