import { ArrowRight, Check, LoaderCircle, Settings, Toilet, Trash, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { COLOR_PRESETS, initials, ownerPalette } from '../lib/slots'

const CONFIRM_TIMEOUT_MS = 3000

function SectionLabel({ children }) {
  return <p className="mb-2 text-[12px] font-medium text-slate-700">{children}</p>
}

export default function AccountModal({
  mode,
  userId,
  initialName = '',
  initialHue,
  mineCount = 0,
  profilesAvailable = true,
  onSave,
  onReleaseAll,
  onClose,
}) {
  const isOnboarding = mode === 'onboarding'
  const [name, setName] = useState(initialName)
  const [hue, setHue] = useState(initialHue)
  const [saving, setSaving] = useState(false)
  const [confirmRelease, setConfirmRelease] = useState(false)
  const [releasing, setReleasing] = useState(false)

  const trimmed = name.trim()
  const valid = trimmed.length >= 2 && trimmed.length <= 24
  const dirty = trimmed !== initialName.trim() || hue !== initialHue
  const palette = ownerPalette(userId ?? trimmed, hue)

  useEffect(() => {
    if (!confirmRelease) return
    const timer = setTimeout(() => setConfirmRelease(false), CONFIRM_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [confirmRelease])

  useEffect(() => {
    if (isOnboarding) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOnboarding, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!valid || saving) return
    setSaving(true)
    await onSave({ name: trimmed, hue })
    setSaving(false)
  }

  async function handleReleaseAll() {
    if (!confirmRelease) {
      setConfirmRelease(true)
      return
    }
    setConfirmRelease(false)
    setReleasing(true)
    await onReleaseAll()
    setReleasing(false)
  }

  return (
    <div
      className="animate-fade-up fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-900/30 p-4 backdrop-blur-sm [animation-duration:0.25s]"
      onMouseDown={(e) => !isOnboarding && e.target === e.currentTarget && onClose?.()}
    >
      <form
        onSubmit={handleSubmit}
        className="animate-pop relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div className="relative p-6">
          {!isOnboarding && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Kapat"
            >
              <X size={15} />
            </button>
          )}

          <div className="mb-5 grid size-10 place-items-center rounded-2xl border border-slate-200/80 bg-zinc-50 shadow-sm">
            {isOnboarding ? <Toilet size={18} className="text-slate-700" /> : <Settings size={18} className="text-slate-700" />}
          </div>
          <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">
            {isOnboarding ? 'Tabloya katıl' : 'Hesap ayarları'}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            {isOnboarding
              ? 'Adını ve rozet rengini seç. Kilitlediğin slotlarda herkes bunu görecek.'
              : 'Adın ve rengin tüm slotlarında, herkesin ekranında anında güncellenir.'}
          </p>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-zinc-50 p-3 shadow-sm">
            <div className="relative flex h-[88px] w-[132px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-sm">
              <span className="font-mono text-[12px] font-medium text-slate-700 tabular-nums">08:20</span>
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="inline-flex shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-800">
                  Dolu
                </span>
                <span
                  className="grid size-4 shrink-0 place-items-center rounded-full text-[8px] font-semibold text-white"
                  style={{ backgroundColor: palette.solid }}
                >
                  {initials(trimmed)}
                </span>
                <span className="truncate text-[11px] font-medium text-slate-700">{trimmed || 'Adın'}</span>
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-500">Diğerleri senin kartlarını böyle görecek.</p>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-[12px] font-medium text-slate-700" htmlFor="display-name">
              Görünen ad
            </label>
            <input
              id="display-name"
              autoFocus
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="örn. Hato"
              className="h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-[14px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
            <p className="mt-1.5 text-[11.5px] text-slate-400">2–24 karakter</p>
          </div>

          <div className="mt-4">
            <SectionLabel>Rozet rengi</SectionLabel>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PRESETS.map((c) => {
                const selected = hue === c.hue
                return (
                  <button
                    key={c.hue}
                    type="button"
                    onClick={() => setHue(c.hue)}
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={selected}
                    className={`grid aspect-square place-items-center rounded-full border transition-all duration-200 hover:scale-105 active:scale-95 ${
                      selected ? 'scale-105 border-slate-900' : 'border-slate-200/80'
                    }`}
                    style={{ backgroundColor: `hsl(${c.hue} 42% 46%)` }}
                  >
                    {selected && <Check size={14} strokeWidth={3} className="text-white" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className="sr-only">Özel renk tonu</span>
              <input
                type="range"
                min={0}
                max={359}
                value={hue ?? palette.hue}
                onChange={(e) => setHue(Number(e.target.value))}
                aria-label="Özel renk tonu"
                className="hue-slider h-2 flex-1"
              />
              <span className="w-9 text-right font-mono text-[11px] text-slate-500 tabular-nums">{hue ?? palette.hue}°</span>
            </div>
          </div>

          {!profilesAvailable && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-800">
              Renk şimdilik yalnızca sende görünür. Herkese görünmesi için Supabase'de güncel{' '}
              <code className="text-amber-900">supabase/schema.sql</code> dosyasını yeniden çalıştır.
            </p>
          )}

          <button
            type="submit"
            disabled={!valid || saving || (!isOnboarding && !dirty)}
            className="group mt-5 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-[13.5px] font-medium text-white shadow-sm transition-all duration-200 enabled:hover:bg-slate-800 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {saving ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <>
                {isOnboarding ? 'Devam et' : 'Değişiklikleri kaydet'}
                <ArrowRight size={14} className="transition-transform duration-200 group-enabled:group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          {!isOnboarding && (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12.5px] font-medium text-slate-800">Slotlarımı bırak</p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    Kilitlediğin <span className="font-mono text-slate-700 tabular-nums">{mineCount}</span> slotun tamamı boşa çıkar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReleaseAll}
                  disabled={mineCount === 0 || releasing}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-[12px] font-medium shadow-sm transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
                    confirmRelease
                      ? 'border-rose-200 bg-rose-100 text-rose-800'
                      : 'border-slate-200/80 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-800'
                  }`}
                >
                  {releasing ? <LoaderCircle size={13} className="animate-spin" /> : <Trash size={13} />}
                  {confirmRelease ? 'Emin misin?' : 'Bırak'}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
