import { useCallback, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Timer, BarChart3, CalendarDays, Scissors, Medal, Settings as Gear, Share2, MonitorPlay, Flag, CalendarClock } from 'lucide-react';
import type { Ctx, Prefs, Profile, Tab } from './lib/types';
import { useNow, useStored, setHaptics, buzz } from './lib/hooks';
import { scheduleFrom } from './lib/notify';
import { pushSupported, showLocalNotification, syncSchedule, TZ_NAME } from './lib/push';
import { parseLocal, calc, DAY } from './lib/time';
import { pad, num } from './lib/format';
import { achievementsFor, LABELS, rankOf, THEMES } from './lib/data';
import { Onboarding } from './components/Onboarding';
import { Home } from './components/Home';
import { Stats } from './components/Stats';
import { CalendarView } from './components/CalendarView';
import { Tape } from './components/Tape';
import { Medals } from './components/Medals';
import { Board } from './components/Board';
import { ShareSheet } from './components/ShareSheet';
import { Settings } from './components/Settings';
import { Bar, Chip, IconBtn, Pogon } from './components/ui';
import { cn } from './utils/cn';

const TABS: { id: Tab; label: string; sub: string; icon: typeof Timer }[] = [
  { id: 'home', label: 'Таймер', sub: 'Обратный отсчёт до дембеля — с точностью до секунды', icon: Timer },
  { id: 'stats', label: 'Стата', sub: 'Служба в цифрах: от месяцев до ударов сердца', icon: BarChart3 },
  { id: 'calendar', label: 'Календарь', sub: 'Каждый день срока — и дневник по дням', icon: CalendarDays },
  { id: 'tape', label: 'Сантиметр', sub: 'Дембельская лента: режем по сантиметру в день', icon: Scissors },
  { id: 'medals', label: 'Медали', sub: 'Достижения за стойкость — выдаются автоматически', icon: Medal },
];

const DEFAULT_PREFS: Prefs = { showMs: true, unitMode: 0, haptics: true, push: false, pushAch: true, pushDays: 10 };

function fire() {
  const cs = getComputedStyle(document.documentElement);
  const colors = [cs.getPropertyValue('--accent').trim(), cs.getPropertyValue('--accent2').trim(), '#ffffff'];
  const end = Date.now() + 1500;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

const shortDate = (ts: number) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

export default function App() {
  const [profile, setProfile] = useStored<Profile | null>('dmb.profile', null);
  const [prefsRaw, setPrefs] = useStored<Prefs>('dmb.prefs', DEFAULT_PREFS);
  const [notes, setNotes] = useStored<Record<string, string>>('dmb.notes', {});
  const [seen, setSeen] = useStored<number>('dmb.seenMedals', -1);
  const [tab, setTabState] = useState<Tab>('home');
  const [settings, setSettings] = useState(false);
  const [board, setBoard] = useState(false);
  const [share, setShare] = useState(false);
  const [toast, setToast] = useState<{ icon: string; title: string } | null>(null);
  const now = useNow(1000);
  const prefs = { ...DEFAULT_PREFS, ...prefsRaw };

  const setTab = useCallback((t: Tab) => {
    setTabState(t);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => setHaptics(prefs.haptics), [prefs.haptics]);

  const theme = profile?.theme ?? 'khaki';
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const t = THEMES.find((x) => x.id === theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t?.bg ?? '#0d100a');
  }, [theme]);

  // миграция со старых версий: тогда в профиле хранился выбор «я служу / я жду»
  useEffect(() => {
    if (!profile) return;
    const legacy = profile as Profile & { mode?: string };
    if (legacy.mode === undefined) return;
    setProfile({ name: legacy.name, start: legacy.start, end: legacy.end, theme: legacy.theme });
  }, [profile, setProfile]);

  const s = profile ? parseLocal(profile.start) : 0;
  const e = profile ? parseLocal(profile.end) : 0;
  const medals = useMemo(() => (profile ? achievementsFor(s, e) : []), [profile, s, e]);
  const gotCount = medals.filter((m) => m.ts <= now).length;

  // new medal detection
  useEffect(() => {
    if (!profile) return;
    if (seen === -1) {
      setSeen(gotCount);
      return;
    }
    if (gotCount > seen) {
      const m = medals[gotCount - 1];
      setToast({ icon: m.icon, title: m.title });
      buzz([20, 60, 20, 60, 40]);
      fire();
      if (prefs.push) void showLocalNotification({ title: `${m.icon} ${m.title}`, body: m.desc, tag: `ach-${m.id}` });
      setSeen(gotCount);
      const t = setTimeout(() => setToast(null), 4200);
      return () => clearTimeout(t);
    }
    if (gotCount < seen) setSeen(gotCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gotCount, profile]);

  // celebrate done on open
  const done = profile ? now >= e : false;
  useEffect(() => {
    if (done) fire();
  }, [done]);

  // держим расписание уведомлений на сервере в актуальном виде
  useEffect(() => {
    if (!prefs.push || !profile || !pushSupported()) return;
    const t = setTimeout(() => {
      void syncSchedule(scheduleFrom(profile, prefs, TZ_NAME));
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.push, prefs.pushAch, prefs.pushDays, profile?.start, profile?.end, profile?.name]);

  // document title live
  useEffect(() => {
    if (!profile) return;
    const c = calc(s, e, now);
    const d = Math.floor(c.left / 86400000);
    document.title = c.done ? 'ДМБ! 🏆' : `${d} дн · ${(c.pct * 100).toFixed(2)}% — ДМБ Таймер`;
  }, [now, profile, s, e]);

  // горячие клавиши для ПК: 1–5 — вкладки, B — табло, S — поделиться
  useEffect(() => {
    if (!profile) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const t = ev.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      const key = ev.key.toLowerCase();
      // пока открыто табло — у него свои клавиши, здесь работает только B (закрыть)
      if (board) {
        if (key === 'b' || key === 'и') setBoard(false);
        return;
      }
      // поверх модалок вкладки не переключаем
      if (settings || share) return;
      const idx = ['1', '2', '3', '4', '5'].indexOf(ev.key);
      if (idx >= 0) setTab(TABS[idx].id);
      else if (key === 'b' || key === 'и') setBoard(true);
      else if (key === 's' || key === 'ы') setShare(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profile, setTab, board, settings, share]);

  if (!profile) {
    return (
      <Onboarding
        onDone={(p) => {
          setSeen(-1);
          setProfile(p);
          setTimeout(fire, 200);
        }}
      />
    );
  }

  const ctx: Ctx = { profile, s, e, now };
  const L = LABELS;
  const c = calc(s, e, now);
  const { idx: rankIdx, rank, list: rankList } = rankOf(c.pct);
  const hour = new Date(now).getHours();
  const greet = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  const activeTab = TABS.find((t) => t.id === tab)!;
  const dayNum = Math.max(1, Math.floor((now - s) / DAY) + 1);
  const totalDays = Math.ceil((e - s) / DAY);
  const clock = new Date(now);
  const clockStr = `${pad(clock.getHours())}:${pad(clock.getMinutes())}:${pad(clock.getSeconds())}`;

  const openBoard = () => {
    buzz();
    setBoard(true);
  };
  const openShare = () => {
    buzz();
    setShare(true);
  };
  const openSettings = () => {
    buzz();
    setSettings(true);
  };

  return (
    <div className="camo-bg ambient min-h-dvh lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* ───────────────────── Десктопный сайдбар ───────────────────── */}
      <aside className="sticky top-0 z-30 hidden h-dvh flex-col border-r border-white/[0.06] bg-black/25 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 px-6 pb-2 pt-7">
          <div className="bg-grad glow grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-[13px] font-black text-black">ДМБ</div>
          <div>
            <div className="font-display text-base font-black leading-tight">ДМБ Таймер</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">штаб отсчёта</div>
          </div>
        </div>

        {/* карточка бойца */}
        <div className="glass mx-4 mt-5 rounded-3xl p-4">
          <div className="flex items-start gap-3">
            <Pogon stripes={rankIdx} gold={rankIdx === rankList.length - 1} className="h-16 w-9 shrink-0 drop-shadow" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold text-white/45">{greet},</div>
              <div className="truncate font-display text-[15px] font-bold leading-tight">{profile.name || L.who}</div>
              <div className="mt-1 inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">{rank.name}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-extrabold tabular text-grad">{(c.pct * 100).toFixed(1)}%</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35">срока</div>
            </div>
          </div>
          <Bar pct={c.pct} shimmer className="mt-3" />
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] leading-tight">
            <div className="rounded-xl bg-white/[0.04] px-2.5 py-2">
              <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-white/35">
                <Flag size={10} /> Призыв
              </div>
              <div className="mt-0.5 font-semibold text-white/80">{shortDate(s)}</div>
            </div>
            <div className="rounded-xl bg-white/[0.04] px-2.5 py-2">
              <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-accent/80">
                <CalendarClock size={10} /> Дембель
              </div>
              <div className="mt-0.5 font-semibold text-white/80">{shortDate(e)}</div>
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between px-0.5 text-xs text-white/50">
            <span>
              День <b className="font-mono text-white">{num(Math.min(dayNum, totalDays))}</b> из {num(totalDays)}
            </span>
            <span>
              осталось <b className="font-mono text-accent">{num(c.left / DAY)} дн</b>
            </span>
          </div>
        </div>

        {/* навигация */}
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto px-4" aria-label="Разделы">
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">Разделы</div>
          {TABS.map((t, i) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  buzz(6);
                  setTab(t.id);
                }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold transition-all',
                  active ? 'bg-accent/15 text-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_30%,transparent)]' : 'text-white/55 hover:bg-white/5 hover:text-white'
                )}
              >
                <span className={cn('absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-grad transition-all', active ? 'opacity-100' : 'opacity-0')} aria-hidden />
                <t.icon size={20} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                <span className="flex-1">{t.label}</span>
                {t.id === 'medals' && gotCount > 0 && (
                  <span className="min-w-5 rounded-full bg-accent2 px-1.5 text-center text-[10px] font-extrabold leading-5 text-black">{gotCount}</span>
                )}
                <span className={cn('kbd transition-opacity', active ? 'opacity-90' : 'opacity-0 group-hover:opacity-70')}>{i + 1}</span>
              </button>
            );
          })}

          <div className="px-2 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">Действия</div>
          <button type="button" onClick={openBoard} className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold text-white/55 transition-colors hover:bg-white/5 hover:text-white">
            <MonitorPlay size={20} className="shrink-0" /> <span className="flex-1">Табло на весь экран</span>
            <span className="kbd opacity-0 transition-opacity group-hover:opacity-70">B</span>
          </button>
          <button type="button" onClick={openShare} className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold text-white/55 transition-colors hover:bg-white/5 hover:text-white">
            <Share2 size={20} className="shrink-0" /> <span className="flex-1">Поделиться</span>
            <span className="kbd opacity-0 transition-opacity group-hover:opacity-70">S</span>
          </button>
          <button type="button" onClick={openSettings} className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold text-white/55 transition-colors hover:bg-white/5 hover:text-white">
            <Gear size={20} className="shrink-0" /> <span className="flex-1">Настройки</span>
          </button>
        </nav>

        {/* подвал: живые часы */}
        <div className="border-t border-white/[0.06] px-6 py-4">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xl font-extrabold tabular">
              {clockStr.slice(0, 5)}
              <span className="text-sm text-white/40">:{clockStr.slice(6)}</span>
            </span>
            <span className="text-xs font-semibold capitalize text-white/40">
              {clock.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-white/30">Клавиши 1–5 — разделы · B — табло · S — поделиться</div>
        </div>
      </aside>

      <div className="relative z-10 min-w-0">
        {/* ───────────────────── Мобильная шапка ───────────────────── */}
        <header className="sticky top-0 z-30 border-b border-white/[0.05] bg-[color-mix(in_oklab,var(--bg)_72%,transparent)] backdrop-blur-xl safe-top lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 pb-3">
            <div className="bg-grad grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-[11px] font-black text-black shadow-lg">ДМБ</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold text-white/45">{greet},</div>
              <div className="truncate font-display text-sm font-bold">
                {profile.name || L.who} <span className="text-accent">· {rank.name}</span>
              </div>
            </div>
            <IconBtn onClick={openBoard} label="Табло">
              <MonitorPlay size={18} />
            </IconBtn>
            <IconBtn onClick={openShare} label="Поделиться">
              <Share2 size={18} />
            </IconBtn>
            <IconBtn onClick={openSettings} label="Настройки">
              <Gear size={18} />
            </IconBtn>
          </div>
        </header>

        <main className="mx-auto w-full max-w-lg px-4 pb-32 pt-4 sm:max-w-2xl lg:max-w-[1180px] lg:px-10 lg:pb-16 lg:pt-9">
          {/* ───────────────────── Заголовок страницы (ПК) ───────────────────── */}
          <div key={`head-${tab}`} className="page-in mb-7 hidden items-end justify-between gap-6 lg:flex">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-accent/80">
                <activeTab.icon size={13} /> ДМБ Таймер
              </div>
              <h1 className="font-display text-4xl font-black leading-none">{activeTab.label}</h1>
              <p className="mt-2 text-sm text-white/45">{activeTab.sub}</p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <Chip>
                день <span className="font-mono text-white">{num(Math.min(dayNum, totalDays))}</span> из {num(totalDays)}
              </Chip>
              <Chip>
                осталось <span className="font-mono text-accent">{num(c.left / DAY)} дн</span>
              </Chip>
              <Chip>
                пройдено <span className="font-mono text-white">{(c.pct * 100).toFixed(2)}%</span>
              </Chip>
            </div>
          </div>

          <div key={tab} className="page-in">
            {tab === 'home' && (
              <Home ctx={ctx} prefs={prefs} setPrefs={setPrefs} openMedals={() => setTab('medals')} onOpenSettings={() => setSettings(true)} />
            )}
            {tab === 'stats' && <Stats ctx={ctx} />}
            {tab === 'calendar' && <CalendarView ctx={ctx} notes={notes} setNotes={setNotes} />}
            {tab === 'tape' && <Tape ctx={ctx} />}
            {tab === 'medals' && <Medals ctx={ctx} />}
          </div>
        </main>
      </div>

      {/* ───────────────────── Мобильная нижняя навигация ───────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 safe-bottom lg:hidden" aria-label="Разделы">
        <div className="glass mx-auto mb-2 flex max-w-lg items-stretch justify-between rounded-[1.6rem] p-1.5 sm:max-w-xl">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  buzz(6);
                  setTab(t.id);
                }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] font-bold transition-all active:scale-95',
                  active ? 'bg-accent/15 text-accent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_25%,transparent)]' : 'text-white/45 hover:text-white/80'
                )}
              >
                <t.icon size={21} strokeWidth={active ? 2.5 : 2} />
                {t.label}
                {t.id === 'medals' && gotCount > 0 && (
                  <span className="absolute right-2 top-1 min-w-4 rounded-full bg-accent2 px-1 text-[9px] leading-4 text-black">{gotCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {toast && (
        <div className="pop-in fixed inset-x-0 top-4 z-[70] flex justify-center px-4 safe-top lg:inset-x-auto lg:bottom-8 lg:right-8 lg:top-auto lg:justify-end lg:p-0">
          <button type="button" className="glass glow card-lift flex items-center gap-3 rounded-2xl px-4 py-3 text-left" onClick={() => setToast(null)}>
            <span className="text-3xl">{toast.icon}</span>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-accent">Новая медаль!</span>
              <span className="block font-display font-bold">{toast.title}</span>
            </span>
          </button>
        </div>
      )}

      {board && <Board ctx={ctx} onClose={() => setBoard(false)} />}
      <ShareSheet ctx={ctx} open={share} onClose={() => setShare(false)} />
      {settings && (
        <Settings
          open={settings}
          onClose={() => setSettings(false)}
          profile={profile}
          setProfile={setProfile}
          prefs={prefs}
          setPrefs={setPrefs}
          notes={notes}
          setNotes={setNotes}
          reset={() => {
            setSettings(false);
            setNotes({});
            setPrefs(DEFAULT_PREFS);
            setSeen(-1);
            setProfile(null);
            setTab('home');
          }}
        />
      )}
    </div>
  );
}
