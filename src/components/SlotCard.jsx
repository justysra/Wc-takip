import { LoaderCircle, Plus, StickyNote, Undo2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { initials, slotEnd, slotStart } from '../lib/slots'

const LONG_PRESS_MS = 450
const MOVE_TOLERANCE_PX = 8

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
  onLongPress,
}) {
  const pressTimer = useRef(null)
  const pressStart = useRef(null)
  const longPressed = useRef(false)

  useEffect(() => () => clearTimeout(pressTimer.current), [])

  function cancelPress() {
    clearTimeout(pressTimer.current)
    pressTimer.current = null
  }

  function fireLongPress() {
    cancelPress()
    longPressed.current = true
    navigator.vibrate?.(12)
    onLongPress?.()
  }

  function handlePointerDown(e) {
    longPressed.current = false
    if (!row || e.button !== 0) return
    pressStart.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    pressTimer.current = setTimeout(fireLongPress, LONG_PRESS_MS)
  }

  function handlePointerMove(e) {
    if (!pressTimer.current) return
    const { x, y } = pressStart.current
    if (Math.hypot(e.clientX - x, e.clientY - y) > MOVE_TOLERANCE_PX) cancelPress()
  }

  // Masaüstünde sağ tık, mobilde sistem menüsü yerine not penceresi açılır.
  function handleContextMenu(e) {
    if (!row) return
    e.preventDefault()
    if (!longPressed.current) fireLongPress()
  }

  function handleClick() {
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    onClick()
  }

  const owned = row && !isArmed
  const note = row?.note?.trim()

  let cls =
    'group relative flex h-[76px] w-full touch-manipulation flex-col justify-between overflow-hidden rounded-xl border px-2.5 py-2 text-left outline-none select-none transition-all duration-200 ease-out [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-[0.98] disabled:cursor-wait'

  if (!row) {
    cls += ' border-slate-200/70 bg-white/80 shadow-sm hover:border-slate-300 hover:bg-white'
  } else if (isArmed) {
    cls += ' border-rose-200/80 bg-rose-50/90 shadow-sm'
  } else {
    cls += isMine ? ' slot-glass ring-1 ring-black/5' : ' slot-glass'
  }
  if (isDimmed) cls += ' opacity-40'
  if (isShaking) cls += ' animate-shake'

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={handleContextMenu}
      disabled={isPending}
      className={cls}
      style={
        owned
          ? {
              '--slot-fill': palette.fill,
              '--slot-deep': palette.fillDeep,
              '--slot-sheen': palette.sheen,
              '--slot-border': palette.fillBorder,
            }
          : undefined
      }
      title={
        row
          ? `${slotStart(index)} – ${slotEnd(index)} · ${ownerName}${note ? ` · ${note}` : ''}${isMine ? ' · Basılı tutarak not yaz' : ''}`
          : `${slotStart(index)} – ${slotEnd(index)} · Boş`
      }
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className="font-mono text-[12px] font-medium tracking-tight text-slate-700 tabular-nums"
          style={owned ? { color: palette.text } : undefined}
        >
          {slotStart(index)}
        </span>
        <span className="flex items-center gap-1">
          {(note || isMine) && owned && (
            <StickyNote
              size={12}
              aria-hidden={!note}
              aria-label={note ? 'Not var' : undefined}
              className={note ? '' : 'opacity-0 group-hover:opacity-50'}
              style={{ color: palette.text }}
            />
          )}
          {isNow && (
            <span className="rounded-full bg-slate-900/85 px-1.5 py-0.5 text-[9.5px] font-medium tracking-wide text-white uppercase">
              Şimdi
            </span>
          )}
        </span>
      </div>

      <div key={row ? `${row.owner_id}-${isArmed}` : 'empty'} className="animate-pop min-w-0">
        {isPending ? (
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <LoaderCircle size={12} className="animate-spin" /> İşleniyor
          </span>
        ) : !row ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            <Plus size={12} />
            Boş
          </span>
        ) : isArmed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-800">
            <Undo2 size={12} /> Bırak?
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className="grid size-4 shrink-0 place-items-center rounded-full text-[8px] font-semibold text-white ring-2 ring-white/75"
              style={{ backgroundColor: palette.solid }}
            >
              {initials(ownerName)}
            </span>
            <span className="truncate text-[11px] font-medium" style={{ color: palette.text }}>
              {note || (isMine ? 'Sen' : ownerName)}
            </span>
          </span>
        )}
      </div>
    </button>
  )
}
