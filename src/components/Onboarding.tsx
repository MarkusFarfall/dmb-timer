import { useState } from 'react';
import { ArrowRight, ArrowLeft, Timer, Medal, CalendarDays, BellRing, WifiOff } from 'lucide-react';
import type { Profile } from '../lib/types';
import { addMonths, parseLocal, toLocalInput } from '../lib/time';
import { DatesFields, ThemePicker, inputCls } from './ProfileForm';
import { cn } from '../utils/cn';
import { buzz } from '../lib/hooks';

const STEPS = 3;
const STEP_TITLES = ['Позывной', 'Сроки службы', 'Войска'];

const FEATURES = [
  { icon: Timer, text: 'Отсчёт до дембеля с точностью до секунды и миллисекунды' },
  { icon: Medal, text: 'Медали за стойкость: от «Первый шаг» до самого ДМБ' },
  { icon: CalendarDays, text: 'Календарь срока и дембельский дневник по дням' },
  { icon: BellRing, text: 'Уведомления о медалях и круглых датах — даже офлайн' },
  { icon: WifiOff, text: 'Работает без интернета, ставится как приложение' },
];

export function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>({
    name: '',
    theme: 'khaki',
    start: toLocalInput(now.getTime()),
    end: toLocalInput(addMonths(now.getTime(), 12)),
  });

  const valid = parseLocal(p.end) > parseLocal(p.start);
  const canNext = step !== 1 || valid;
  const next = () => {
    if (!canNext) return;
    buzz(12);
    if (step < STEPS - 1) setStep(step + 1);
    else onDone(p);
  };
  const applyTheme = (t: Profile['theme']) => {
    document.documentElement.dataset.theme = t;
    setP({ ...p, theme: t });
  };

  return (
    <div className="camo-bg ambient min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ───────── левая панель (ПК): бренд и возможности ───────── */}
      <aside className="relative z-10 hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-black/25 p-12 backdrop-blur-xl lg:flex xl:p-16">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-grad glow grid h-12 w-12 place-items-center rounded-2xl font-display text-[13px] font-black text-black">ДМБ</div>
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">штаб отсчёта</div>
          </div>
          <h1 className="mt-14 font-display text-6xl font-black leading-[1.05] xl:text-7xl">
            <span className="text-grad">ДМБ</span>
            <br />
            таймер
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/60">
            Считаем каждый день, час и секунду до свободы. Звания, сантиметр, медали и дневник — весь срок как на ладони.
          </p>
          <ul className="mt-10 space-y-4">
            {FEATURES.map((f, i) => (
              <li key={i} className="pop-in flex items-start gap-3.5" style={{ animationDelay: `${i * 90}ms` }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                  <f.icon size={19} />
                </span>
                <span className="pt-2 text-[15px] font-medium leading-snug text-white/75">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-14">
          <div className="flex gap-6">
            {STEP_TITLES.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => i < step && setStep(i)}
                className={cn('flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors', i === step ? 'text-accent' : i < step ? 'text-white/70 hover:text-white' : 'text-white/30')}
              >
                <span className={cn('grid h-6 w-6 place-items-center rounded-full border font-mono text-[11px]', i === step ? 'border-accent bg-accent text-black' : 'border-white/20')}>
                  {i + 1}
                </span>
                {t}
              </button>
            ))}
          </div>
          <p className="mt-8 font-display text-sm font-semibold text-white/35">«Дембель неизбежен, как восход солнца.»</p>
        </div>
      </aside>

      {/* ───────── форма ───────── */}
      <div className="relative z-10 flex min-h-dvh flex-col px-5 safe-top safe-bottom lg:min-h-0 lg:items-center lg:justify-center lg:p-12">
        <div className="glass-lg mx-auto flex w-full max-w-md flex-1 flex-col lg:max-w-lg lg:flex-none lg:rounded-[2rem] lg:p-9">
          <div className="flex items-center gap-2 pt-4 lg:pt-0">
            {Array.from({ length: STEPS }, (_, i) => (
              <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className={cn('h-full bg-grad transition-all duration-500', i <= step ? 'w-full' : 'w-0')} />
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex justify-between text-[11px] font-bold uppercase tracking-wider">
            <span className="text-accent">{STEP_TITLES[step]}</span>
            <span className="text-white/30">шаг {step + 1} из {STEPS}</span>
          </div>

          <div key={step} className="pop-in flex-1 pt-8 lg:pt-7">
            {step === 0 && (
              <>
                <div className="mb-2 font-display text-5xl font-black leading-none lg:hidden">
                  <span className="text-grad">ДМБ</span>
                  <br />
                  таймер
                </div>
                <p className="mb-8 text-white/60 lg:hidden">Считаем каждый день, час и секунду до свободы.</p>
                <h2 className="mb-2 font-display text-3xl font-black">Как тебя звать, боец?</h2>
                <p className="mb-6 text-white/55">Будет на карточке и в приветствии. Можно позывной.</p>
                <input
                  autoFocus
                  value={p.name}
                  onChange={(e) => setP({ ...p, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && next()}
                  placeholder="Рядовой Иванов"
                  className={inputCls + ' text-lg'}
                  maxLength={30}
                  aria-label="Имя или позывной"
                />
                <p className="mt-3 text-xs text-white/35">Можно оставить пустым — будем звать просто «Боец».</p>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="mb-2 font-display text-3xl font-black">Сроки службы</h2>
                <p className="mb-6 text-white/55">Укажи точное время — таймер учитывает часы и минуты.</p>
                <DatesFields p={p} set={setP} />
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="mb-2 font-display text-3xl font-black">Выбери войска</h2>
                <p className="mb-6 text-white/55">Цветовая схема приложения. Поменять можно в любой момент.</p>
                <ThemePicker value={p.theme} onChange={applyTheme} />
                <p className="mt-4 text-xs text-white/35">Тема применяется сразу — посмотри, как перекрасился экран.</p>
              </>
            )}
          </div>

          <div className="flex gap-3 py-6 lg:pb-0 lg:pt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                aria-label="Назад"
                title="Назад"
                className="hover-zoom grid h-14 w-14 place-items-center rounded-2xl bg-white/5 transition-colors hover:bg-white/10 active:scale-95"
              >
                <ArrowLeft />
              </button>
            )}
            <button
              type="button"
              disabled={!canNext}
              onClick={next}
              className="bg-grad glow hover-zoom flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl font-display font-bold text-black transition active:scale-[0.98] disabled:opacity-40"
            >
              {step === STEPS - 1 ? 'Погнали!' : 'Дальше'} <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
