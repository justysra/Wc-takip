import { LoaderCircle, StickyNote, Trash, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { initials, slotEnd, slotStart } from '../lib/slots'

export const NOTE_MAX_LENGTH = 140

export default function NoteModal({ index, row, ownerName, palette, isMine, onSave, onClose }) {
  const initial = row.note?.trim() ?? ''
  const [text, setText] = useState(initial)
  const [saving, setSaving] = useState(false)
  const trimmed = text.trim()
  const dirty = trimmed !== initial

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function save(value) {
    if (saving) return
    setSaving(true)
    await onSave(value)
    setSaving(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (isMine && dirty) save(trimmed || null)
  }

  return (
    <div
      className="animate-fade-up fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-900/30 p-4 backdrop-blur-sm [animation-duration:0.25s]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="animate-pop relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div className="relative p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            <X size={15} />
          </button>

          <div
            className="mb-5 grid size-10 place-items-center rounded-2xl border"
            style={{ backgroundColor: palette.fill, borderColor: palette.fillBorder, color: palette.text }}
          >
            <StickyNote size={18} />
          </div>
          <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">
            {isMine ? (initial ? 'Notu düzenle' : 'Not ekle') : 'Slot notu'}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500">
            <span className="font-mono tabular-nums">
              {slotStart(index)} – {slotEnd(index)}
            </span>
            <span>·</span>
            <span
              className="grid size-4 shrink-0 place-items-center rounded-full text-[8px] font-semibold text-white"
              style={{ backgroundColor: palette.solid }}
            >
              {initials(ownerName)}
            </span>
            <span className="truncate">{isMine ? 'Sen' : ownerName}</span>
          </p>

          {isMine ? (
            <>
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={NOTE_MAX_LENGTH}
                rows={3}
                placeholder="örn. 5 dk gecikebilirim"
                className="mt-5 w-full resize-none rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-[14px] leading-relaxed text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
              <p className="mt-1.5 text-right font-mono text-[11.5px] text-slate-400 tabular-nums">
                {text.length}/{NOTE_MAX_LENGTH}
              </p>

              <div className="mt-4 flex gap-2">
                {initial && (
                  <button
                    type="button"
                    onClick={() => save(null)}
                    disabled={saving}
                    className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-sm transition-all duration-200 hover:bg-rose-50 hover:text-rose-800 active:scale-95 disabled:opacity-30"
                  >
                    <Trash size={13} /> Sil
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!dirty || saving}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-[13.5px] font-medium text-white shadow-sm transition-all duration-200 enabled:hover:bg-slate-800 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {saving && <LoaderCircle size={14} className="animate-spin" />}
                  Kaydet
                </button>
              </div>
            </>
          ) : (
            <p
              className="mt-5 rounded-xl border px-3 py-2.5 text-[14px] leading-relaxed break-words whitespace-pre-wrap"
              style={{ backgroundColor: palette.fill, borderColor: palette.fillBorder, color: palette.text }}
            >
              {initial || 'Bu slota not eklenmemiş.'}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
