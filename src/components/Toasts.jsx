import { CircleCheck, CircleX, Info, Lock, X } from 'lucide-react'
import { TOAST_DURATION_MS } from '../hooks/useToasts'

const TONES = {
  success: { icon: CircleCheck, iconCls: 'text-emerald-700', bar: 'bg-emerald-400' },
  warning: { icon: Lock, iconCls: 'text-amber-700', bar: 'bg-amber-400' },
  error: { icon: CircleX, iconCls: 'text-rose-700', bar: 'bg-rose-400' },
  info: { icon: Info, iconCls: 'text-slate-600', bar: 'bg-slate-400' },
}

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[360px]"
    >
      {toasts.map((t) => {
        const { icon: Icon, iconCls, bar } = TONES[t.tone] ?? TONES.info
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ${
              t.leaving ? 'animate-toast-out' : 'animate-toast-in'
            }`}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <Icon size={16} strokeWidth={2.2} className={`mt-0.5 shrink-0 ${iconCls}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-slate-900">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{t.description}</p>}
              </div>
              <button
                onClick={() => onDismiss(t.id)}
                className="-mr-1 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Kapat"
              >
                <X size={14} />
              </button>
            </div>
            <div
              className={`animate-countdown absolute bottom-0 left-0 h-px w-full origin-left opacity-70 ${bar}`}
              style={{ animationDuration: `${TOAST_DURATION_MS}ms` }}
            />
          </div>
        )
      })}
    </div>
  )
}
