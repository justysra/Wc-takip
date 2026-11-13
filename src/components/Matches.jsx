import { Heart } from 'lucide-react'
import { initials } from '../lib/slots'
import { matchLabel } from '../lib/matches'

export default function Matches({ matches, mineCount, focusedId, onFocus }) {
  if (mineCount === 0) {
    return (
      <p className="text-[13px] text-slate-500">
        Önce birkaç slot kilitle; saatine yakın kilitleyenlerle eşleşmeni burada görürsün.
      </p>
    )
  }

  if (matches.length === 0) {
    return (
      <p className="text-[13px] text-slate-500">
        Henüz ±15 dk içinde yakın bir saat yok. Başkaları senin dilimlerine yakın slot alınca match çıkar.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {matches.map((m) => {
        const active = focusedId === m.id
        return (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onFocus(active ? null : m.id)}
              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 active:scale-[0.995] ${
                focusedId && !active ? 'opacity-40 hover:opacity-80' : ''
              } ${active ? 'border-slate-300 bg-slate-50 ring-1 ring-slate-900/10' : 'border-slate-200/80 bg-white hover:border-slate-300'}`}
            >
              <span
                className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white ring-2 ring-white"
                style={{ backgroundColor: m.palette.solid }}
              >
                {initials(m.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="truncate text-[13.5px] font-medium text-slate-900">{m.name}</span>
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-rose-600/90">
                    <Heart size={11} className="fill-current" />
                    {m.percent}% · {matchLabel(m.percent)}
                  </span>
                </span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {m.samples.map((s) => (
                    <span
                      key={`${s.mineLabel}-${s.theirsLabel}`}
                      className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-slate-600"
                    >
                      sen {s.mineLabel}
                      <span className="mx-1 text-slate-400">·</span>
                      o {s.theirsLabel}
                      {s.minutesApart > 0 && (
                        <span className="ml-1 text-slate-400">({s.minutesApart} dk)</span>
                      )}
                    </span>
                  ))}
                  {m.pairCount > m.samples.length && (
                    <span className="px-1 font-mono text-[11px] text-slate-400">
                      +{m.pairCount - m.samples.length}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
