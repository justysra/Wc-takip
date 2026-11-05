import { PartyPopper, RotateCcw, Settings, Shuffle, Toilet } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AccountModal from './components/AccountModal'
import Contributors from './components/Contributors'
import ProgressBar from './components/ProgressBar'
import SetupNotice from './components/SetupNotice'
import SlotCard from './components/SlotCard'
import Toasts from './components/Toasts'
import { useSlots } from './hooks/useSlots'
import { useToasts } from './hooks/useToasts'
import { isDemo } from './lib/backend'
import { fillDemoRandomly, resetDemo } from './lib/demoBackend'
import {
  currentSlotIndex,
  defaultHue,
  HOURS,
  initials,
  ownerPalette,
  slotEnd,
  slotStart,
  TOTAL_SLOTS,
} from './lib/slots'

const NAME_KEY = 'tuvalet-takip:username'
const ARM_TIMEOUT_MS = 3000
const FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'empty', label: 'Boş' },
  { id: 'mine', label: 'Benim' },
]

function Backdrop({ children }) {
  return <div className="relative min-h-svh overflow-x-clip bg-zinc-50">{children}</div>
}

export default function App() {
  return (
    <Backdrop>
      <Board />
    </Backdrop>
  )
}

function StatusPill({ status }) {
  const map = {
    live: { label: 'Canlı', cls: 'bg-emerald-100 text-emerald-800' },
    offline: { label: 'Bağlantı koptu', cls: 'bg-rose-100 text-rose-800' },
    connecting: { label: 'Bağlanıyor', cls: 'bg-slate-100 text-slate-600' },
  }
  const s = map[status] ?? map.connecting
  return (
    <span className={`flex h-7 items-center rounded-full px-2.5 text-[12px] font-medium ${s.cls}`}>{s.label}</span>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11.5px] font-medium text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-[22px] font-semibold tracking-tight tabular-nums ${accent ?? 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  )
}

function FilterTabs({ value, onChange }) {
  const activeIndex = FILTERS.findIndex((f) => f.id === value)
  return (
    <div className="relative grid grid-cols-3 rounded-xl border border-slate-200/80 bg-slate-100/80 p-0.5 shadow-sm">
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/3)] rounded-lg border border-slate-200/80 bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`relative z-10 h-7 px-3 text-[12px] font-medium transition-colors duration-200 ${
            value === f.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

function GhostButton({ icon: Icon, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex h-7 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-2.5 text-[12px] font-medium text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
    >
      <Icon size={13} /> {children}
    </button>
  )
}

function Board() {
  const [username, setUsername] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pending, setPending] = useState(() => new Set())
  const [armed, setArmed] = useState(null)
  const [shaking, setShaking] = useState(null)
  const [focusedId, setFocusedId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [nowIndex, setNowIndex] = useState(() => currentSlotIndex())

  const {
    userId,
    ready,
    slots,
    profiles,
    profilesAvailable,
    status,
    error,
    claim,
    release,
    releaseAll,
    saveProfile,
  } = useSlots()
  const { toasts, push, dismiss } = useToasts()

  useEffect(() => {
    const timer = setInterval(() => setNowIndex(currentSlotIndex()), 30_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (armed === null) return
    const timer = setTimeout(() => setArmed(null), ARM_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [armed])

  useEffect(() => {
    if (shaking === null) return
    const timer = setTimeout(() => setShaking(null), 400)
    return () => clearTimeout(timer)
  }, [shaking])

  const ownerOf = useCallback(
    (ownerId, fallbackName) => {
      const profile = profiles.get(ownerId)
      const name = (ownerId === userId && username) || profile?.display_name || fallbackName || 'Anonim'
      return { name, palette: ownerPalette(ownerId, profile?.hue ?? undefined) }
    },
    [profiles, userId, username],
  )

  const contributors = useMemo(() => {
    const byOwner = new Map()
    for (const row of slots?.values() ?? []) {
      const entry = byOwner.get(row.owner_id)
      if (!entry) byOwner.set(row.owner_id, { id: row.owner_id, fallback: row.owner_name, count: 1, last: row.claimed_at })
      else {
        entry.count++
        if (row.claimed_at > entry.last) Object.assign(entry, { fallback: row.owner_name, last: row.claimed_at })
      }
    }
    return [...byOwner.values()]
      .map((c) => ({ ...c, ...ownerOf(c.id, c.fallback) }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'))
  }, [slots, ownerOf])

  const mineCount = contributors.find((c) => c.id === userId)?.count ?? 0
  const filled = slots.size
  const myProfile = userId ? profiles.get(userId) : null
  const myHue = myProfile?.hue ?? (userId ? defaultHue(userId) : undefined)

  async function handleSaveAccount({ name, hue }) {
    const isFirstTime = !username
    localStorage.setItem(NAME_KEY, name)
    setUsername(name)
    const result = await saveProfile({ displayName: name, hue })
    setSettingsOpen(false)
    if (result.ok) {
      if (!isFirstTime) push('success', 'Hesap güncellendi', 'Adın ve rengin herkesin ekranında yenilendi.')
    } else if (result.missingTable) {
      push('warning', 'Renk sadece sende görünür', "Herkese görünmesi için supabase/schema.sql'i yeniden çalıştır.")
    } else {
      push('error', 'Ayarlar kaydedilemedi', result.message)
    }
  }

  async function handleReleaseAll() {
    const result = await releaseAll()
    if (result.ok) push('info', 'Slotların bırakıldı', `${result.count} slot tekrar boşta.`)
    else push('error', 'İşlem başarısız', result.message)
  }

  const setSlotPending = useCallback((index, on) => {
    setPending((prev) => {
      const next = new Set(prev)
      if (on) next.add(index)
      else next.delete(index)
      return next
    })
  }, [])

  async function handleSlotClick(index) {
    if (pending.has(index) || !userId) return
    const row = slots.get(index)
    const range = `${slotStart(index)} – ${slotEnd(index)}`

    if (!row) {
      setArmed(null)
      setSlotPending(index, true)
      const result = await claim(index, username)
      setSlotPending(index, false)
      if (result.ok) push('success', 'Slot kilitlendi', `${range} artık senin.`)
      else if (result.reason === 'taken') push('warning', 'Slot az önce alındı', 'Biri bu bloğu senden hemen önce kilitledi.')
      else push('error', 'İşlem başarısız', result.message)
      return
    }

    if (row.owner_id !== userId) {
      setShaking(index)
      push('warning', 'Bu slot sana ait değil', `${range} bloğunu ${ownerOf(row.owner_id, row.owner_name).name} kilitledi. Sadece o geri bırakabilir.`)
      return
    }

    if (armed !== index) {
      setArmed(index)
      return
    }

    setArmed(null)
    setSlotPending(index, true)
    const result = await release(index)
    setSlotPending(index, false)
    if (result.ok) push('info', 'Slot serbest bırakıldı', `${range} tekrar boşta.`)
    else if (result.reason === 'forbidden') push('warning', 'Yetkin yok', 'Bu slotu yalnızca sahibi bırakabilir.')
    else push('error', 'İşlem başarısız', result.message)
  }

  function isDimmed(row) {
    if (focusedId && row?.owner_id !== focusedId) return true
    if (filter === 'empty') return Boolean(row)
    if (filter === 'mine') return !row || row.owner_id !== userId
    return false
  }

  if (status === 'error') return <SetupNotice error={error} />

  const myPalette = userId ? ownerPalette(userId, myHue) : null

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="grid size-7 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
                <Toilet size={14} className="text-slate-700" />
              </div>
              <span className="truncate text-[14px] font-semibold tracking-tight text-slate-900">Tuvalet Blokları</span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <span className="hidden text-[13px] text-slate-500 sm:inline">24 saat · 72 slot</span>
              {isDemo && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-600">
                  Demo
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <StatusPill status={status} />
              {username && myPalette && (
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="group flex h-7 items-center gap-2 rounded-full border border-slate-200/80 bg-white pr-2.5 pl-0.5 text-[12.5px] font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 active:scale-95"
                  title="Hesap ayarları"
                >
                  <span
                    className="grid size-6 place-items-center rounded-full text-[9.5px] font-semibold text-white"
                    style={{ backgroundColor: myPalette.solid }}
                  >
                    {initials(username)}
                  </span>
                  <span className="hidden max-w-[8rem] truncate sm:inline">{username}</span>
                  <Settings
                    size={12}
                    className="text-slate-400 transition-all duration-300 group-hover:rotate-90 group-hover:text-slate-700"
                  />
                </button>
              )}
            </div>
          </div>
          <div className="pb-3">
            <ProgressBar filled={filled} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-10 pb-28 sm:px-6 sm:pt-14">
        <section className="animate-fade-up">
          <h1 className="text-[34px] leading-[1.05] font-semibold tracking-[-0.035em] text-slate-900 sm:text-[52px]">
            24 saat, 72 blok.
            <br />
            <span className="text-slate-400">Hep birlikte dolduruyoruz.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-slate-500">
            Her kart 20 dakikalık bir dilim. Boş bir karta dokun, o saat sana kilitlensin. Kilitlediğin kartı yalnızca sen
            geri bırakabilirsin.
          </p>
        </section>

        {filled === TOTAL_SLOTS && (
          <div className="animate-fade-up mt-8 flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-100 px-4 py-3 text-[13.5px] text-emerald-800 shadow-sm">
            <PartyPopper size={16} className="shrink-0" />
            Tablo tamamlandı. 24 saatin tamamı imece usulü kilitlendi.
          </div>
        )}

        <section className="animate-fade-up mt-10 grid grid-cols-2 gap-2 [animation-delay:80ms] sm:grid-cols-4 sm:gap-3">
          <Stat label="Kilitli" value={filled} accent="text-rose-800" />
          <Stat label="Boş" value={TOTAL_SLOTS - filled} accent="text-emerald-800" />
          <Stat label="Senin" value={mineCount} />
          <Stat label="Katılımcı" value={contributors.length} />
        </section>

        <section className="animate-fade-up mt-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm [animation-delay:140ms]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[12.5px] font-medium text-slate-700">Katkıda bulunanlar</h2>
            {focusedId && (
              <button
                onClick={() => setFocusedId(null)}
                className="text-[12px] text-slate-500 transition-colors hover:text-slate-800"
              >
                Filtreyi temizle
              </button>
            )}
          </div>
          <Contributors contributors={contributors} userId={userId} focusedId={focusedId} onFocus={setFocusedId} />
        </section>

        <section className="animate-fade-up mt-12 [animation-delay:200ms]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Zaman çizelgesi</h2>
              <span className="font-mono text-[12px] text-slate-400 tabular-nums">00:00 – 24:00</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isDemo && (
                <>
                  <GhostButton icon={Shuffle} onClick={fillDemoRandomly}>
                    Doldur
                  </GhostButton>
                  <GhostButton icon={RotateCcw} onClick={resetDemo}>
                    Sıfırla
                  </GhostButton>
                </>
              )}
              <FilterTabs value={filter} onChange={setFilter} />
            </div>
          </div>

          {!ready ? (
            <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {HOURS.map(({ hour }) => (
                <div key={hour}>
                  <div className="mb-2 h-3 w-10 rounded bg-slate-200" />
                  <div className="grid grid-cols-3 gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-[88px] animate-pulse rounded-2xl border border-slate-200/80 bg-white shadow-sm" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {HOURS.map(({ hour, slots: indices }) => {
                const filledInHour = indices.filter((i) => slots.has(i)).length
                const label = `${String(hour).padStart(2, '0')}:00`
                return (
                  <div key={hour}>
                    <div className="mb-2 flex items-center gap-2 px-0.5">
                      <span
                        className={`font-mono text-[11px] font-medium tabular-nums ${
                          hour === Math.floor(nowIndex / 3) ? 'text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {label}
                      </span>
                      <span className="h-px flex-1 bg-slate-200" />
                      <span
                        className={`rounded-full px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums ${
                          filledInHour === 3
                            ? 'bg-rose-100 text-rose-800'
                            : filledInHour === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {filledInHour}/3
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {indices.map((i) => {
                        const row = slots.get(i)
                        const owner = row ? ownerOf(row.owner_id, row.owner_name) : null
                        return (
                          <SlotCard
                            key={i}
                            index={i}
                            row={row}
                            ownerName={owner?.name}
                            palette={owner?.palette}
                            isMine={Boolean(row && row.owner_id === userId)}
                            isNow={i === nowIndex}
                            isPending={pending.has(i)}
                            isArmed={armed === i}
                            isDimmed={isDimmed(row)}
                            isShaking={shaking === i}
                            onClick={() => handleSlotClick(i)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-6 text-[12px] text-slate-500">
          <span>Değişiklikler herkesin ekranında anında güncellenir.</span>
          <span className="font-mono tabular-nums">
            {filled}/{TOTAL_SLOTS}
          </span>
        </footer>
      </main>

      <Toasts toasts={toasts} onDismiss={dismiss} />

      {(!username || settingsOpen) && (
        <AccountModal
          key={username ? 'settings' : 'onboarding'}
          mode={username ? 'settings' : 'onboarding'}
          userId={userId}
          initialName={username}
          initialHue={myHue}
          mineCount={mineCount}
          profilesAvailable={profilesAvailable}
          onSave={handleSaveAccount}
          onReleaseAll={handleReleaseAll}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  )
}
