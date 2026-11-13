import { slotStart } from './slots'

/** Aynı işeme ritmine yakın sayılacak mesafe: ±15 dk (3 × 5 dk slot). */
export const MATCH_WINDOW_SLOTS = 3

/** Ekranda yalnızca en güçlü bu kadar eşleşme gösterilir. */
export const TOP_MATCHES = 2

/**
 * Senin kilitlediğin slotlara zamansal olarak yakın (≤15 dk) slotu olan
 * kişileri skorlayıp yalnızca en iyi 2’yi döner.
 */
export function computeMatches(slots, userId, ownerOf) {
  if (!userId || !slots?.size) return []

  const mine = []
  const others = new Map()

  for (const row of slots.values()) {
    if (row.owner_id === userId) {
      mine.push(row.slot_index)
      continue
    }
    let entry = others.get(row.owner_id)
    if (!entry) {
      entry = { id: row.owner_id, fallback: row.owner_name, indices: [] }
      others.set(row.owner_id, entry)
    }
    entry.indices.push(row.slot_index)
  }

  if (mine.length === 0 || others.size === 0) return []

  const results = []

  for (const person of others.values()) {
    const pairs = []
    let score = 0

    for (const my of mine) {
      for (const theirs of person.indices) {
        const distance = Math.abs(my - theirs)
        if (distance > MATCH_WINDOW_SLOTS) continue
        score += MATCH_WINDOW_SLOTS + 1 - distance
        pairs.push({ mine: my, theirs, distance })
      }
    }

    if (score === 0) continue

    pairs.sort((a, b) => a.distance - b.distance || a.mine - b.mine)
    const covered = new Set(pairs.map((p) => p.mine)).size
    const percent = Math.max(1, Math.round((covered / mine.length) * 100))
    const samples = pairs.slice(0, 3).map((p) => ({
      mineLabel: slotStart(p.mine),
      theirsLabel: slotStart(p.theirs),
      minutesApart: p.distance * 5,
    }))

    results.push({
      id: person.id,
      score,
      percent,
      pairCount: pairs.length,
      samples,
      ...ownerOf(person.id, person.fallback),
    })
  }

  return results
    .sort((a, b) => b.score - a.score || b.percent - a.percent || a.name.localeCompare(b.name, 'tr'))
    .slice(0, TOP_MATCHES)
}

export function matchLabel(percent) {
  if (percent >= 70) return 'Güçlü match'
  if (percent >= 40) return 'İyi match'
  return 'Yakın saat'
}
