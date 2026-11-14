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
  { hue: 95, label: 'Altın' },
  { hue: 54, label: 'Turuncu' },
  { hue: 29, label: 'Kırmızı' },
  { hue: 255, label: 'Mavi' },
  { hue: 145, label: 'Yeşil' },
  { hue: 350, label: 'Pembe' },
]

/** Daha önce seçilmemiş renkler bu 12 tondan gelir; liste uzasa da kaymaz. */
const DEFAULT_HUES = [245, 275, 300, 330, 355, 22, 45, 80, 140, 170, 192, 215]

export function defaultHue(key) {
  return DEFAULT_HUES[hashString(key) % DEFAULT_HUES.length]
}

function wrapHue(hue) {
  return ((hue % 360) + 360) % 360
}

/** Sarı-turuncuyu çamurdan, kırmızıyı bağırganlıktan uzak tutan oklch kroma. */
function chromaFor(hue) {
  const h = wrapHue(hue)
  if (h >= 50 && h <= 95) return 0.1
  if (h >= 18 && h < 50) return 0.088
  if (h >= 330 || h < 18) return 0.078
  return 0.07
}

/** Hazır rozetlerin doygun hali. Ara tonlar çubuktan seçilince normal cam paleti kalır. */
const VIVID = {
  95: { l: 0.78, c: 0.15, fillL: 0.95, fillC: 0.08 },
  54: { l: 0.68, c: 0.19, fillL: 0.93, fillC: 0.09 },
  29: { l: 0.55, c: 0.23, fillL: 0.92, fillC: 0.09 },
  255: { l: 0.52, c: 0.16, fillL: 0.93, fillC: 0.06 },
  145: { l: 0.55, c: 0.16, fillL: 0.93, fillC: 0.07 },
  350: { l: 0.66, c: 0.16, fillL: 0.94, fillC: 0.06 },
}

function vividTone(hue) {
  const v = VIVID[hue]
  if (!v) return null
  return {
    text: `oklch(0.38 ${Math.min(v.c, 0.14)} ${hue})`,
    solid: `oklch(${v.l} ${v.c} ${hue})`,
    tint: `oklch(0.97 ${(v.fillC * 0.4).toFixed(3)} ${hue})`,
    soft: `oklch(0.95 ${(v.fillC * 0.7).toFixed(3)} ${hue})`,
    fill: `oklch(${v.fillL} ${v.fillC} ${hue})`,
    fillDeep: `oklch(${(v.fillL - 0.08).toFixed(2)} ${(v.fillC + 0.04).toFixed(3)} ${hue})`,
    fillBorder: `oklch(${(v.fillL - 0.16).toFixed(2)} ${(v.c * 0.7).toFixed(3)} ${hue} / 0.55)`,
    sheen: `oklch(0.99 0.02 ${hue} / 0.8)`,
    border: `oklch(${(v.fillL - 0.08).toFixed(2)} ${(v.fillC * 0.8).toFixed(3)} ${hue})`,
    ring: `oklch(${v.l} ${v.c} ${hue})`,
  }
}

/** Kimliğe (veya seçilmiş tona) göre açık zeminde okunan cam paleti üretir. */
export function ownerPalette(key, preferredHue) {
  const hue = wrapHue(Number.isFinite(preferredHue) ? preferredHue : defaultHue(key))
  const vivid = vividTone(hue)
  if (vivid) return { hue, glow: '0 1px 2px rgb(15 23 42 / 0.05)', dotGlow: 'none', ...vivid }
  const c = chromaFor(hue)
  return {
    hue,
    text: `oklch(0.38 ${c * 0.8} ${hue})`,
    solid: `oklch(0.52 ${Math.min(c + 0.055, 0.155)} ${hue})`,
    tint: `oklch(0.97 ${c * 0.35} ${hue})`,
    soft: `oklch(0.95 ${c * 0.48} ${hue})`,
    fill: `oklch(0.935 ${c * 0.7} ${hue})`,
    fillDeep: `oklch(0.86 ${c} ${hue})`,
    fillBorder: `oklch(0.78 ${c * 0.65} ${hue} / 0.5)`,
    sheen: `oklch(0.995 ${c * 0.22} ${hue} / 0.78)`,
    border: `oklch(0.88 ${c * 0.38} ${hue})`,
    ring: `oklch(0.68 ${c} ${hue})`,
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
