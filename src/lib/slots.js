export const SLOT_MINUTES = 5
export const SLOTS_PER_HOUR = 60 / SLOT_MINUTES
export const TOTAL_SLOTS = 24 * SLOTS_PER_HOUR

const pad = (n) => String(n).padStart(2, '0')

function formatMinutes(total) {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

export function slotStart(index) {
  return formatMinutes(index * SLOT_MINUTES)
}

export function slotEnd(index) {
  return formatMinutes((index + 1) * SLOT_MINUTES)
}

/** Önceden tohumlanmış tablolarda sahibi olmayan satırlar boş slot sayılır. */
export function isClaimed(row) {
  return row?.slot_index != null && Boolean(row.owner_id)
}

export function currentSlotIndex(date = new Date()) {
  return Math.floor((date.getHours() * 60 + date.getMinutes()) / SLOT_MINUTES)
}

export const HOURS = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  slots: Array.from({ length: SLOTS_PER_HOUR }, (_, i) => hour * SLOTS_PER_HOUR + i),
}))

function hashString(value) {
  const str = String(value ?? '')
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const COLOR_PRESETS = [
  { hue: 245, label: 'İndigo' },
  { hue: 275, label: 'Mor' },
  { hue: 300, label: 'Eflatun' },
  { hue: 330, label: 'Pembe' },
  { hue: 355, label: 'Kırmızı' },
  { hue: 22, label: 'Turuncu' },
  { hue: 45, label: 'Kehribar' },
  { hue: 80, label: 'Limon' },
  { hue: 140, label: 'Yeşil' },
  { hue: 170, label: 'Turkuaz' },
  { hue: 192, label: 'Camgöbeği' },
  { hue: 215, label: 'Mavi' },
]

export function defaultHue(key) {
  return hashString(key) % 360
}

/** Kimliğe (veya seçilmiş tona) göre açık zeminde okunan yumuşak bir palet üretir. */
export function ownerPalette(key, preferredHue) {
  const hue = Number.isFinite(preferredHue) ? preferredHue : defaultHue(key)
  return {
    hue,
    text: `hsl(${hue} 32% 28%)`,
    solid: `hsl(${hue} 42% 46%)`,
    tint: `hsl(${hue} 45% 97%)`,
    soft: `hsl(${hue} 40% 94%)`,
    border: `hsl(${hue} 24% 84%)`,
    ring: `hsl(${hue} 28% 62%)`,
    glow: '0 1px 2px rgb(15 23 42 / 0.05)',
    dotGlow: 'none',
  }
}

export function initials(name) {
  const clean = String(name ?? '').trim()
  if (!clean) return '?'
  const parts = clean.split(/\s+/)
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : clean.slice(0, 2)
  return letters.toLocaleUpperCase('tr-TR')
}

const UNIT_SUFFIX = ['ı', 'i', 'si', 'ü', 'ü', 'i', 'sı', 'si', 'i', 'u']
const TENS_SUFFIX = { 1: 'u', 2: 'si', 3: 'u', 4: 'ı', 5: 'si', 6: 'ı', 7: 'i', 8: 'i', 9: 'ı' }

/** Türkçe iyelik eki: 1'i, 2'si, 30'u, 40'ı ... */
export function withPossessive(n) {
  const unit = n % 10
  const tens = Math.floor(n / 10) % 10
  let suffix
  if (n === 0) suffix = 'ı'
  else if (unit !== 0) suffix = UNIT_SUFFIX[unit]
  else if (tens !== 0) suffix = TENS_SUFFIX[tens]
  else suffix = 'ü'
  return `${n}’${suffix}`
}
