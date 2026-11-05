import { TOTAL_SLOTS } from './slots'

// Supabase olmadan arayüzü denemek için tarayıcı içi sahte arka uç.
// Veriler localStorage'da tutulur; her sekme ayrı bir kullanıcıdır ve sekmeler arası canlı senkronize olur.

const STORE_KEY = 'tuvalet-takip:demo-slots'
const PROFILE_KEY = 'tuvalet-takip:demo-profiles'
const USER_KEY = 'tuvalet-takip:demo-user'
const VERSION_KEY = 'tuvalet-takip:demo-version'
const DATA_VERSION = '5min-empty'
const LATENCY_MS = 250

const FAKE_USERS = [
  { id: 'demo-ayse', name: 'Ayşe' },
  { id: 'demo-mehmet', name: 'Mehmet K.' },
  { id: 'demo-zeynep', name: 'Zeynep' },
  { id: 'demo-can', name: 'Can' },
  { id: 'demo-elif', name: 'Elif Su' },
]

const listeners = new Set()
const wait = () => new Promise((r) => setTimeout(r, LATENCY_MS))

function makeRow(index, user) {
  return { slot_index: index, owner_name: user.name, owner_id: user.id, claimed_at: new Date().toISOString() }
}

/** Eski tohumlanmış demo kayıtlarını bir kez siler. Tablo boş başlar. */
export function clearLegacyDemoStorage() {
  if (localStorage.getItem(VERSION_KEY) === DATA_VERSION) return
  localStorage.removeItem(STORE_KEY)
  localStorage.removeItem(PROFILE_KEY)
  localStorage.setItem(VERSION_KEY, DATA_VERSION)
}

function read() {
  clearLegacyDemoStorage()
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
  } catch {
    // Bozuk kayıt boş tablo sayılır.
  }
  return {}
}

function write(rows) {
  localStorage.setItem(STORE_KEY, JSON.stringify(rows))
  listeners.forEach((fn) => fn())
}

function readProfiles() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null')
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    // Bozuk kayıt: boş kabul edilir.
  }
  return {}
}

function currentUserId() {
  let id = sessionStorage.getItem(USER_KEY)
  if (!id) {
    id = `demo-${crypto.randomUUID()}`
    sessionStorage.setItem(USER_KEY, id)
  }
  return id
}

export const demoBackend = {
  async ensureSession() {
    return { id: currentUserId() }
  },

  async list() {
    return Object.values(read()).filter(Boolean)
  },

  async listProfiles() {
    return Object.values(readProfiles()).filter(Boolean)
  },

  async saveProfile({ displayName, hue }) {
    await wait()
    const profiles = readProfiles()
    const profile = { id: currentUserId(), display_name: displayName, hue, updated_at: new Date().toISOString() }
    profiles[profile.id] = profile
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles))
    return { ok: true, profile }
  },

  async releaseAll() {
    await wait()
    const rows = read()
    const me = currentUserId()
    let count = 0
    for (const [index, row] of Object.entries(rows)) {
      if (row?.owner_id === me) {
        delete rows[index]
        count++
      }
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(rows))
    return { ok: true, count }
  },

  subscribe({ onResync, onStatus, onProfilesResync }) {
    const onStorage = (e) => {
      if (e.key === STORE_KEY) onResync()
      if (e.key === PROFILE_KEY) onProfilesResync()
    }
    window.addEventListener('storage', onStorage)
    listeners.add(onResync)
    onStatus('live')
    return () => {
      window.removeEventListener('storage', onStorage)
      listeners.delete(onResync)
    }
  },

  async claim(index, ownerName) {
    await wait()
    const rows = read()
    if (rows[index]) return { ok: false, reason: 'taken' }
    const row = makeRow(index, { id: currentUserId(), name: ownerName })
    rows[index] = row
    localStorage.setItem(STORE_KEY, JSON.stringify(rows))
    return { ok: true, row }
  },

  async release(index) {
    await wait()
    const rows = read()
    if (!rows[index] || rows[index].owner_id !== currentUserId()) return { ok: false, reason: 'forbidden' }
    delete rows[index]
    localStorage.setItem(STORE_KEY, JSON.stringify(rows))
    return { ok: true }
  },
}

export function resetDemo() {
  write({})
}

export function fillDemoRandomly() {
  const rows = read()
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    if (!rows[i]) rows[i] = makeRow(i, FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)])
  }
  write(rows)
}
