import { LoaderCircle, Plus, Undo2 } from 'lucide-react'
import { initials, slotEnd, slotStart } from '../lib/slots'

export default function SlotCard({
  index,
  row,
  ownerName,
  palette,
  isMine,
  isNow,
  isPending,
  isArmed,
  isDimmed,
  isShaking,
  onClick,
}) {
  let cls =
    'group relative flex h-[76px] w-full flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 text-left shadow-sm outline-none transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-indigo-300 active:scale-[0.98] disabled:cursor-wait'

  if (!row) {
    cls += ' hover:border-emerald-200 hover:bg-emerald-50/60'
  } else if (isArmed) {
    cls += ' border-rose-200 bg-rose-50'
  } else if (isMine) {
    cls += ' border-slate-300'
  }
  if (isDimmed) cls += ' opacity-40'
  if (isShaking) cls += ' animate-shake'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={cls}
      title={`${slotStart(index)} – ${slotEnd(index)} · ${row ? ownerName : 'Boş'}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[12px] font-medium tracking-tight text-slate-700 tabular-nums">
          {slotStart(index)}
        </span>
        {isNow && (
          <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wide text-indigo-800 uppercase">
            Şimdi
          </span>
        )}
      </div>

      <div key={row ? `${row.owner_id}-${isArmed}` : 'empty'} className="animate-pop min-w-0">
        {isPending ? (
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <LoaderCircle size={12} className="animate-spin" /> İşleniyor
          </span>
        ) : !row ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
            <Plus size={12} />
            Boş
          </span>
        ) : isArmed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-800">
            <Undo2 size={12} /> Bırak?
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="inline-flex shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-800">
              Dolu
            </span>
            <span
              className="grid size-4 shrink-0 place-items-center rounded-full text-[8px] font-semibold text-white"
              style={{ backgroundColor: palette.solid }}
            >
              {initials(ownerName)}
            </span>
            <span className="truncate text-[11px] font-medium text-slate-700">{isMine ? 'Sen' : ownerName}</span>
          </span>
        )}
      </div>
    </button>
  )
}
