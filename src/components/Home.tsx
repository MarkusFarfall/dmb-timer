import { useEffect, useMemo, useState } from 'react';
import { BellRing, ChevronRight, RefreshCw, Sparkles, Repeat, MoveRight, Flag, PartyPopper } from 'lucide-react';
import type { Ctx, Prefs } from '../lib/types';
import { calc, split, monthsBetween, DAY, HOUR, MIN, WEEK, startOfDay } from '../lib/time';
import { pad, plural, W, num, fmtDate, fmtDur } from '../lib/format';
import { rankOf, LABELS, routineNow, achievementsFor, QUOTES } from '../lib/data';
import { useRafNow, buzz } from '../lib/hooks';
import { pushSupported } from '../lib/push';
import { Bar, Card, ProgressRing, Pogon, SectionTitle } from './ui';
import { cn } from '../utils/cn';

function HeroRing({ ctx, showMs }: { ctx: Ctx; showMs: boolean }) {
  const now = useRafNow(showMs, 30);
  const { s, e } = ctx;
  const c = calc(s, e, now);
  const L = LABELS;
  const target = c.notStarted ? s - now : c.done ? now - e : c.left;
  const t = split(target);
  return (
    <div className="ring-halo">
      <ProgressRing pct={c.pct} className="max-w-[320px] lg:max-w-[420px]">
        <div className="px-6 text-center">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45 lg:text-xs">
            {c.notStarted ? 'до начала' : c.done ? 'на свободе уже' : L.until}
          </div>
          <div className="font-display text-7xl font-black leading-none tabular text-grad sm:text-8xl lg:text-[6.5rem]">{t.days}</div>
          <div className="mt-1 text-sm font-semibold text-white/70 lg:text-base">{plural(t.days, W.day)}</div>
          <div className="mt-3 font-mono text-2xl font-bold tabular lg:text-3xl">
            {pad(t.hours)}
            <span className="blink text-accent">:</span>
            {pad(t.minutes)}
            <span className="blink text-accent">:</span>
            {pad(t.seconds)}
            {showMs && <span className="text-base text-white/40 lg:text-lg">.{pad(t.millis, 3)}</span>}
          </div>
        </div>
      </ProgressRing>
    </div>
  );
}

/** четыре большие «штабные» плитки обратного отсчёта (правая колонка героя на ПК) */
function CountdownTiles({ ctx }: { ctx: Ctx }) {
  const now = useRafNow(true, 50);
  const c = calc(ctx.s, ctx.e, now);
  const target = c.notStarted ? ctx.s - now : c.done ? now - ctx.e : c.left;
  const t = split(target);
  const tiles = [
    { v: String(t.days), u: plural(t.days, W.day), big: true },
    { v: pad(t.hours), u: plural(t.hours, W.hour), big: false },
    { v: pad(t.minutes), u: plural(t.minutes, W.min), big: false },
    { v: pad(t.seconds), u: plural(t.seconds, W.sec), big: false },
  ];
  return (
    <div className="grid grid-cols-4 gap-3" aria-label="Обратный отсчёт">
      {tiles.map((x) => (
        <div key={x.u} className="digit-tile rounded-2xl px-2 py-4 text-center">
          <div className={cn('font-mono font-extrabold leading-none tabular', x.big ? 'text-grad text-4xl xl:text-5xl' : 'text-3xl text-white xl:text-4xl')}>{x.v}</div>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{x.u}</div>
        </div>
      ))}
    </div>
  );
}

function LivePercent({ ctx, align = 'center' }: { ctx: Ctx; align?: 'center' | 'left' }) {
  const now = useRafNow(true, 20);
  const c = calc(ctx.s, ctx.e, now);
  const L = LABELS;
  const str = (c.pct * 100).toFixed(7);
  const [int, dec] = str.split('.');
  const left = align === 'left';
  return (
    <div className={left ? 'text-left' : 'text-center'}>
      <div className="font-mono text-3xl font-extrabold tabular lg:text-[2.6rem] lg:leading-none">
        <span className="text-grad">{int}</span>
        <span className="text-white/40">.</span>
        <span className="text-white/80">{dec}</span>
        <span className="text-accent">%</span>
      </div>
      <div className="mt-1.5 text-xs font-semibold uppercase tracking-widest text-white/40">{L.passed.toLowerCase()} срока</div>
      <Bar pct={c.pct} shimmer className={cn('mt-3 h-2.5', !left && 'mx-auto max-w-xs')} />
    </div>
  );
}

/** правая колонка героя — только большие экраны */
function HeroAside({ ctx }: { ctx: Ctx }) {
  const c = calc(ctx.s, ctx.e, ctx.now);
  return (
    <div className="hidden min-w-0 flex-col justify-center gap-7 lg:flex">
      <div>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
          {c.notStarted ? 'До начала службы' : c.done ? 'Служба окончена' : 'До дембеля осталось'}
        </div>
        <CountdownTiles ctx={ctx} />
      </div>
      <LivePercent ctx={ctx} align="left" />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 font-semibold text-white/70">
          <Flag size={13} className="text-white/40" /> {fmtDate(ctx.s, false)}
        </span>
        <MoveRight size={16} className="text-accent" aria-hidden />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 font-semibold text-accent">
          <PartyPopper size={13} /> {fmtDate(ctx.e, false)}
        </span>
        <span className="text-white/40">всего {num((ctx.e - ctx.s) / HOUR)} часов службы</span>
      </div>
    </div>
  );
}

const UNIT_MODES = ['Дни · часы · мин · сек', 'Только часы', 'Только минуты', 'Только секунды', 'Недели и дни', 'Месяцы и дни', 'Сердцебиения ❤️'];

function UnitCounter({ ctx, unit, setUnit }: { ctx: Ctx; unit: number; setUnit: (n: number) => void }) {
  const now = useRafNow(true, 15);
  const c = calc(ctx.s, ctx.e, now);
  const left = c.notStarted ? ctx.e - ctx.s : c.left;
  const t = split(left);
  const mode = unit % UNIT_MODES.length;
  let big: { v: string; u: string }[] = [];
  switch (mode) {
    case 0:
      big = [
        { v: String(t.days), u: 'дн' },
        { v: pad(t.hours), u: 'ч' },
        { v: pad(t.minutes), u: 'мин' },
        { v: pad(t.seconds), u: 'сек' },
      ];
      break;
    case 1:
      big = [
        { v: num(left / HOUR), u: plural(left / HOUR, W.hour) },
        { v: pad(t.minutes), u: 'мин' },
        { v: pad(t.seconds), u: 'сек' },
      ];
      break;
    case 2:
      big = [
        { v: num(left / MIN), u: plural(left / MIN, W.min) },
        { v: pad(t.seconds), u: 'сек' },
      ];
      break;
    case 3:
      big = [{ v: num(left / 1000), u: plural(left / 1000, W.sec) }];
      break;
    case 4: {
      const w = Math.floor(left / WEEK);
      const d = Math.floor((left % WEEK) / DAY);
      big = [
        { v: String(w), u: plural(w, W.week) },
        { v: String(d), u: plural(d, W.day) },
        { v: pad(t.hours), u: 'ч' },
      ];
      break;
    }
    case 5: {
      const mb = monthsBetween(now, ctx.e);
      const d = Math.floor(mb.rest / DAY);
      const h = Math.floor((mb.rest % DAY) / HOUR);
      big = [
        { v: String(mb.months), u: plural(mb.months, W.month) },
        { v: String(d), u: plural(d, W.day) },
        { v: pad(h), u: 'ч' },
      ];
      break;
    }
    case 6:
      big = [{ v: num((left / MIN) * 72), u: 'ударов сердца' }];
      break;
  }
  return (
    <Card
      className="h-full"
      onClick={() => {
        buzz();
        setUnit((unit + 1) % UNIT_MODES.length);
      }}
      delay={60}
    >
      <SectionTitle
        right={
          <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
            <Repeat size={12} /> {UNIT_MODES[mode]}
          </span>
        }
      >
        Осталось
      </SectionTitle>
      <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-2 py-1">
        {big.map((b, i) => (
          <div key={i} className="text-center">
            <div className="font-mono text-3xl font-extrabold tabular sm:text-4xl">{b.v}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{b.u}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
        {UNIT_MODES.map((_, i) => (
          <span key={i} className={cn('h-1.5 rounded-full transition-all', i === mode ? 'w-5 bg-accent' : 'w-1.5 bg-white/15')} />
        ))}
      </div>
      <div className="mt-2 text-center text-[11px] text-white/30">нажми, чтобы сменить единицы</div>
    </Card>
  );
}

function RankCard({ ctx, pct }: { ctx: Ctx; pct: number }) {
  const { idx, rank, next, list } = rankOf(pct);
  const total = ctx.e - ctx.s;
  const segPct = next ? (pct - rank.min) / (next.min - rank.min) : 1;
  const nextAt = next ? ctx.s + total * next.min : 0;
  return (
    <Card delay={120} className="h-full">
      <SectionTitle>Звание</SectionTitle>
      <div className="flex items-center gap-4">
        <Pogon stripes={idx} gold={idx === list.length - 1} className="h-24 w-14 shrink-0 drop-shadow-lg" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl font-black text-grad">{rank.name}</div>
          <p className="mt-1 text-sm leading-snug text-white/60">{rank.desc}</p>
          {next && (
            <>
              <Bar pct={segPct} className="mt-3 h-1.5" />
              <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-white/45">
                <span>→ {next.name}</span>
                <span>через {fmtDur(nextAt - ctx.now)}</span>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mt-4 flex gap-1">
        {list.map((r, i) => (
          <div key={r.name} className="flex-1 text-center" title={`${r.name} — от ${Math.round(r.min * 100)}% срока`}>
            <div className={`h-1 rounded-full ${i <= idx ? 'bg-accent' : 'bg-white/10'}`} />
            <div className={`mt-1 truncate text-[9px] font-bold uppercase ${i === idx ? 'text-accent' : 'text-white/30'}`}>{r.name}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TodayCard({ ctx }: { ctx: Ctx }) {
  const { s, e, now } = ctx;
  const dayNum = Math.floor((now - s) / DAY) + 1;
  const totalDays = Math.ceil((e - s) / DAY);
  const sod = startOfDay(now);
  const todayPct = (now - sod) / DAY;
  const r = routineNow(now);
  return (
    <Card delay={180} className="h-full">
      <SectionTitle right={<span className="text-[11px] font-bold capitalize text-white/40">{new Date(now).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</span>}>
        Сегодня
      </SectionTitle>
      <div className="flex items-end justify-between">
        <div>
          <div className="font-display text-3xl font-black">
            День <span className="text-grad">{num(dayNum)}</span>
          </div>
          <div className="text-sm text-white/50">из {num(totalDays)} дней службы</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-bold">{Math.floor(todayPct * 100)}%</div>
          <div className="text-[11px] text-white/40">дня позади</div>
        </div>
      </div>
      <div className="relative mt-3 h-8 overflow-hidden rounded-xl bg-white/5">
        <div className="bg-grad absolute inset-y-0 left-0 opacity-80" style={{ width: `${todayPct * 100}%` }} />
        {[6, 12, 18].map((h) => (
          <div key={h} className="absolute inset-y-0 w-px bg-white/20" style={{ left: `${(h / 24) * 100}%` }}>
            <span className="absolute left-1 top-1 text-[9px] font-bold text-white/60">{h}:00</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        <div className="text-2xl">{r.cur.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">По распорядку сейчас</div>
          <div className="truncate font-bold">{r.isSleep ? 'Сон 😴' : r.cur.name}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-white/40">{r.next.icon} {r.next.name}</div>
          <div className="font-mono text-sm font-bold text-accent">через {fmtDur(r.nextAt - now)}</div>
        </div>
      </div>
    </Card>
  );
}

function NextMedal({ ctx, onOpen }: { ctx: Ctx; onOpen: () => void }) {
  const list = useMemo(() => achievementsFor(ctx.s, ctx.e), [ctx.s, ctx.e]);
  const next = list.find((a) => a.ts > ctx.now);
  const got = list.filter((a) => a.ts <= ctx.now);
  if (!next) return null;
  const prev = got[got.length - 1];
  const segPct = (ctx.now - (prev?.ts ?? ctx.s)) / (next.ts - (prev?.ts ?? ctx.s));
  return (
    <Card onClick={onOpen} delay={240} className="h-full">
      <SectionTitle right={<span className="text-[11px] font-bold text-white/40">{got.length}/{list.length} получено</span>}>Следующая медаль</SectionTitle>
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/5 text-3xl grayscale-[0.4]">{next.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="font-bold">{next.title}</div>
          <div className="text-xs text-white/50">{fmtDate(next.ts)}</div>
          <div className="mt-1 font-mono text-sm font-bold text-accent">через {fmtDur(next.ts - ctx.now)}</div>
        </div>
        <ChevronRight className="shrink-0 text-white/30" />
      </div>
      <Bar pct={segPct} className="mt-4" />
      <div className="mt-1.5 text-right text-[11px] font-semibold text-white/40">{Math.floor(Math.max(0, Math.min(1, segPct)) * 100)}% пути к медали</div>
    </Card>
  );
}

function QuoteCard() {
  const list = QUOTES;
  const daily = Math.floor(Date.now() / DAY) % list.length;
  const [i, setI] = useState(daily);
  return (
    <Card delay={300} className="relative h-full overflow-hidden">
      <span className="pointer-events-none absolute -right-1 -top-5 select-none font-display text-[7rem] font-black leading-none text-white/[0.05]" aria-hidden>
        »
      </span>
      <SectionTitle
        right={
          <button
            type="button"
            aria-label="Другая цитата"
            title="Другая цитата"
            onClick={() => {
              buzz();
              setI((i + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length);
            }}
            className="hover-zoom grid h-7 w-7 place-items-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white active:rotate-180"
          >
            <RefreshCw size={13} />
          </button>
        }
      >
        Мудрость дня
      </SectionTitle>
      <p key={i} className="fade relative font-display text-lg font-semibold leading-snug lg:text-xl">«{list[i]}»</p>
    </Card>
  );
}

function DoneCard({ ctx }: { ctx: Ctx }) {
  const L = LABELS;
  return (
    <Card className="text-center lg:py-10">
      <Sparkles className="mx-auto mb-2 text-accent" size={40} />
      <div className="font-display text-4xl font-black text-grad lg:text-6xl">{L.doneTitle}</div>
      <p className="mt-2 text-white/60 lg:text-lg">{L.doneSub}</p>
      <p className="mt-3 text-sm text-white/40">Отсчитано {num((ctx.e - ctx.s) / HOUR)} часов. Легенда.</p>
    </Card>
  );
}

function NotifyNudge({ onOpen }: { onOpen: () => void }) {
  return (
    <Card onClick={onOpen} delay={360} className="h-full">
      <div className="flex items-center gap-3">
        <div className="bg-grad glow grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-black">
          <BellRing size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold">Включить уведомления</div>
          <div className="text-xs text-white/50">Медали, экватор и сводка каждые 10 дней — даже когда приложение закрыто</div>
        </div>
        <ChevronRight className="shrink-0 text-white/30" />
      </div>
    </Card>
  );
}

export function Home({
  ctx,
  prefs,
  setPrefs,
  openMedals,
  onOpenSettings,
}: {
  ctx: Ctx;
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  openMedals: () => void;
  onOpenSettings: () => void;
}) {
  const c = calc(ctx.s, ctx.e, ctx.now);
  // десктопная колонка героя монтируется только на широких экранах —
  // иначе её RAF-часы зря крутились бы на телефоне под display:none
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return (
    <div className="space-y-4 lg:space-y-5">
      {/* герой: кольцо + (на ПК) плитки и процент справа */}
      <section className="glass pop-in rounded-[2rem] p-5 sm:p-7 lg:grid lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:items-center lg:gap-12 lg:p-10">
        <HeroRing ctx={ctx} showMs={prefs.showMs} />
        {wide ? (
          <HeroAside ctx={ctx} />
        ) : (
          <div className="mt-5 lg:hidden">
            <LivePercent ctx={ctx} />
          </div>
        )}
      </section>

      {c.done ? (
        <DoneCard ctx={ctx} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5 xl:grid-cols-3">
          <UnitCounter ctx={ctx} unit={prefs.unitMode} setUnit={(n) => setPrefs({ ...prefs, unitMode: n })} />
          {!c.notStarted && <RankCard ctx={ctx} pct={c.pct} />}
          {!c.notStarted && <TodayCard ctx={ctx} />}
          <NextMedal ctx={ctx} onOpen={openMedals} />
          <QuoteCard />
          {pushSupported() && !prefs.push && <NotifyNudge onOpen={onOpenSettings} />}
        </div>
      )}
      {c.done && (
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          <QuoteCard />
          {pushSupported() && !prefs.push && <NotifyNudge onOpen={onOpenSettings} />}
        </div>
      )}
    </div>
  );
}
