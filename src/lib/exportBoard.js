import writeExcelFile from 'write-excel-file/browser'
import { slotEnd, slotStart, TOTAL_SLOTS } from './slots'

const COLS = 6
const INK = '#1c1917'
const MUTED = '#78716c'
const LINE = '#e7e5e4'
const PAPER = '#f5f5f4'
const WHITE = '#ffffff'

function stamp(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function hslHex(h, s, l) {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function span(value, style, columns = COLS) {
  return [{ value, columnSpan: columns, ...style }, ...Array(columns - 1).fill(null)]
}

function header(value) {
  return {
    value,
    fontWeight: 'bold',
    fontSize: 10,
    textColor: '#fafaf9',
    backgroundColor: INK,
    align: 'center',
    alignVertical: 'center',
    height: 24,
    borderColor: INK,
    borderStyle: 'thin',
  }
}

function cell(value, extra = {}) {
  return {
    value: value === '' ? null : value,
    fontSize: 11,
    alignVertical: 'center',
    height: 22,
    borderColor: LINE,
    borderStyle: 'thin',
    ...extra,
  }
}

function contributorsOf(slots, ownerOf) {
  const byOwner = new Map()
  for (const row of slots.values()) {
    const current = byOwner.get(row.owner_id)
    if (current) current.count += 1
    else {
      const owner = ownerOf(row.owner_id, row.owner_name)
      byOwner.set(row.owner_id, { name: owner.name, hue: owner.palette?.hue, count: 1 })
    }
  }
  return [...byOwner.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'))
}

function boardSheet(slots, ownerOf, date) {
  const filled = [...slots.values()].length
  const when = date.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const rows = [
    span('24 Saat · Tuvalet Blokları', {
      fontWeight: 'bold',
      fontSize: 18,
      textColor: INK,
      alignVertical: 'center',
      height: 32,
    }),
    span(`${when}   ·   ${filled} dolu   ·   ${TOTAL_SLOTS - filled} boş`, {
      fontSize: 11,
      textColor: MUTED,
      height: 20,
    }),
    span('', { height: 8 }),
    ['Saat', 'Başlangıç', 'Bitiş', 'Durum', 'Kişi', 'Not'].map(header),
  ]

  for (let index = 0; index < TOTAL_SLOTS; index += 1) {
    const row = slots.get(index)
    const owner = row ? ownerOf(row.owner_id, row.owner_name) : null
    const hue = owner?.palette?.hue
    const filled = Boolean(row)
    const wash = filled ? hslHex(hue, 34, 95) : WHITE
    const ink = filled ? hslHex(hue, 36, 26) : INK
    const note = row?.note?.trim() ?? ''
    const hourStart = index % 12 === 0
    const edge = hourStart ? { topBorderColor: '#d6d3d1', topBorderStyle: 'medium' } : {}

    rows.push([
      hourStart
        ? cell(slotStart(index), {
            rowSpan: 12,
            fontWeight: 'bold',
            align: 'center',
            backgroundColor: PAPER,
            textColor: INK,
            ...edge,
          })
        : null,
      cell(slotStart(index), { align: 'center', textColor: '#44403c', backgroundColor: wash, fontFamily: 'Consolas', ...edge }),
      cell(slotEnd(index), { align: 'center', textColor: '#44403c', backgroundColor: wash, fontFamily: 'Consolas', ...edge }),
      cell(filled ? 'Dolu' : 'Boş', {
        align: 'center',
        fontWeight: 'bold',
        fontSize: 10,
        textColor: filled ? ink : MUTED,
        backgroundColor: filled ? hslHex(hue, 42, 88) : PAPER,
        ...edge,
      }),
      cell(owner?.name ?? '', { textColor: filled ? ink : MUTED, backgroundColor: wash, indent: 1, ...edge }),
      cell(note, {
        textColor: MUTED,
        backgroundColor: wash,
        wrap: true,
        fontStyle: note ? 'italic' : undefined,
        indent: 1,
        height: note.length > 42 ? 36 : 22,
        ...edge,
      }),
    ])
  }

  return rows
}

function summarySheet(slots, ownerOf, date) {
  const people = contributorsOf(slots, ownerOf)
  const filled = [...slots.values()].length
  const when = date.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const metric = (label, value) => [
    cell(label, { textColor: MUTED, backgroundColor: PAPER, indent: 1 }),
    cell(value, { fontWeight: 'bold', align: 'right', textColor: INK, backgroundColor: WHITE }),
    null,
  ]

  const rows = [
    span('Günün özeti', { fontWeight: 'bold', fontSize: 18, textColor: INK, height: 32 }, 3),
    span(when, { fontSize: 11, textColor: MUTED, height: 20 }, 3),
    span('', { height: 8 }, 3),
    [header('Ölçü'), header('Değer'), null],
    metric('Kilitli', filled),
    metric('Boş', TOTAL_SLOTS - filled),
    metric('Katılımcı', people.length),
    span('', { height: 16 }, 3),
    [header('Kişi'), header('Slot'), header('Pay')],
  ]

  if (people.length === 0) {
    rows.push(span('Henüz kimse slot kilitlemedi.', { textColor: MUTED, fontStyle: 'italic', height: 22 }, 3))
    return rows
  }

  for (const person of people) {
    const wash = Number.isFinite(person.hue) ? hslHex(person.hue, 34, 95) : WHITE
    const ink = Number.isFinite(person.hue) ? hslHex(person.hue, 36, 26) : INK
    const share = filled ? `${Math.round((person.count / filled) * 100)}%` : '0%'
    rows.push([
      cell(person.name, { textColor: ink, backgroundColor: wash, fontWeight: 'bold', indent: 1 }),
      cell(person.count, { align: 'center', textColor: ink, backgroundColor: wash, type: Number }),
      cell(share, { align: 'center', textColor: MUTED, backgroundColor: wash }),
    ])
  }

  return rows
}

export function createWorkbookSheets(slots, ownerOf, date = new Date()) {
  return [
    {
      data: boardSheet(slots, ownerOf, date),
      sheet: 'Tablo',
      columns: [{ width: 12 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 22 }, { width: 42 }],
      stickyRowsCount: 4,
      stickyColumnsCount: 1,
      showGridLines: false,
      orientation: 'landscape',
    },
    {
      data: summarySheet(slots, ownerOf, date),
      sheet: 'Özet',
      columns: [{ width: 28 }, { width: 14 }, { width: 14 }],
      stickyRowsCount: 4,
      showGridLines: false,
    },
  ]
}

export async function downloadBoard(slots, ownerOf, date = new Date()) {
  await writeExcelFile(createWorkbookSheets(slots, ownerOf, date), {
    fontFamily: 'Calibri',
    fontSize: 11,
  }).toFile(`tuvalet-bloklari-${stamp(date)}.xlsx`)
}
