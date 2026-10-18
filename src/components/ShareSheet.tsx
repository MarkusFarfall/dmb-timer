import { useEffect, useState } from 'react';
import { Download, Share2, Copy, Check } from 'lucide-react';
import type { Ctx } from '../lib/types';
import { makeCard, shareText } from '../lib/share';
import { Sheet } from './ui';
import { buzz } from '../lib/hooks';
import { cn } from '../utils/cn';

export function ShareSheet({ ctx, open, onClose }: { ctx: Ctx; open: boolean; onClose: () => void }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    let u = '';
    makeCard(ctx).then((b) => {
      setBlob(b);
      u = URL.createObjectURL(b);
      setUrl(u);
    });
    return () => {
      if (u) URL.revokeObjectURL(u);
      setUrl('');
      setBlob(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const text = shareText(ctx);
  const file = blob ? new File([blob], 'dmb.png', { type: 'image/png' }) : null;
  const canShareFile = !!file && !!navigator.canShare?.({ files: [file] });

  const doShare = async () => {
    buzz();
    try {
      if (canShareFile && file) await navigator.share({ files: [file], text });
      else if (navigator.share) await navigator.share({ text, title: 'ДМБ Таймер' });
      else copy();
    } catch {
      /* cancelled */
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      buzz([10, 30, 10]);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };
  const download = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmb-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  const actions = [
    {
      key: 'share',
      onClick: doShare,
      primary: true,
      icon: <Share2 size={20} />,
      label: 'Отправить',
      hint: 'Картинка и текст — в мессенджер или соцсети',
    },
    {
      key: 'download',
      onClick: download,
      primary: false,
      icon: <Download size={20} />,
      label: 'Скачать картинку',
      hint: 'PNG-карточка — для сторис и статуса',
    },
    {
      key: 'copy',
      onClick: copy,
      primary: false,
      icon: copied ? <Check size={20} className="text-accent" /> : <Copy size={20} />,
      label: copied ? 'Скопировано!' : 'Копировать текст',
      hint: 'Готовый текст со статистикой',
    },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Поделиться" wide>
      <div className="grid items-start gap-5 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <div className="mx-auto aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-3xl bg-white/5 shadow-2xl ring-1 ring-white/10 sm:mx-0">
          {url ? <img src={url} alt="Карточка с итогами службы" className="h-full w-full object-cover" /> : <div className="shimmer h-full w-full" />}
        </div>
        <div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-1 sm:gap-2.5">
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={a.onClick}
                className={cn(
                  'hover-zoom flex flex-col items-center gap-1 rounded-2xl py-3 text-xs font-bold transition active:scale-[0.98] sm:flex-row sm:gap-3 sm:px-4 sm:py-3.5 sm:text-left sm:text-sm',
                  a.primary ? 'bg-grad glow text-black' : 'bg-white/5 hover:bg-white/10'
                )}
              >
                {a.icon}
                <span className="sm:flex-1">
                  {a.label}
                  <span className={cn('mt-0.5 hidden text-[11px] font-semibold leading-tight sm:block', a.primary ? 'text-black/60' : 'text-white/40')}>{a.hint}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-white/40">Текст сообщения</div>
          <pre className="mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-white/5 p-3.5 font-sans text-xs leading-relaxed text-white/65">{text}</pre>
        </div>
      </div>
    </Sheet>
  );
}
