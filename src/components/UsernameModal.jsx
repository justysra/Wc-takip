import { ArrowRight, Toilet, X } from 'lucide-react'
import { useState } from 'react'

export default function UsernameModal({ initialName = '', onSave, onClose }) {
  const [name, setName] = useState(initialName)
  const trimmed = name.trim()
  const valid = trimmed.length >= 2 && trimmed.length <= 24

  function handleSubmit(e) {
    e.preventDefault()
    if (valid) onSave(trimmed)
  }

  return (
    <div className="animate-fade-up fixed inset-0 z-[60] grid place-items-center bg-slate-900/30 p-4 backdrop-blur-sm [animation-duration:0.25s]">
      <form
        onSubmit={handleSubmit}
        className="animate-pop relative w-full max-w-[380px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div className="relative p-6">
          {onClose && (
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
            <Toilet size={18} className="text-slate-700" />
          </div>
          <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">
            {onClose ? 'Görünen adını değiştir' : 'Tabloya katıl'}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            Kilitlediğin slotlarda bu isim görünecek. Sadece bu cihazda saklanır.
          </p>

          <label className="mt-5 block text-[12px] font-medium text-slate-700" htmlFor="username">
            Kullanıcı adı
          </label>
          <input
            id="username"
            autoFocus
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="örn. Hato"
            className="mt-1.5 h-10 w-full rounded-xl border border-slate-200/80 bg-white px-3 text-[14px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
          <p className="mt-1.5 text-[11.5px] text-slate-400">2–24 karakter</p>

          <button
            type="submit"
            disabled={!valid}
            className="group mt-5 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-[13.5px] font-medium text-white shadow-sm transition-all duration-200 enabled:hover:bg-slate-800 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {onClose ? 'Kaydet' : 'Devam et'}
            <ArrowRight size={14} className="transition-transform duration-200 group-enabled:group-hover:translate-x-0.5" />
          </button>
        </div>
      </form>
    </div>
  )
}
