import { initials } from '../lib/slots'

export default function Contributors({ contributors, userId, focusedId, onFocus }) {
  if (contributors.length === 0) {
    return <p className="text-[13px] text-slate-500">Henüz kimse slot kilitlemedi. İlk sen ol.</p>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {contributors.map((c) => {
        const active = focusedId === c.id
        return (
          <button
            key={c.id}
            onClick={() => onFocus(active ? null : c.id)}
            className={`flex items-center gap-2 rounded-full border py-1 pr-2.5 pl-1 text-[12px] font-medium shadow-sm transition-all duration-200 active:scale-[0.98] ${
              focusedId && !active ? 'opacity-40 hover:opacity-80' : ''
            } ${active ? 'ring-1 ring-slate-900/15' : ''}`}
            style={{
              backgroundColor: c.palette.fill,
              borderColor: c.palette.fillBorder,
              color: c.palette.text,
            }}
            title={`${c.name} · ${c.count} slot`}
          >
            <span
              className="grid size-5 place-items-center rounded-full text-[9px] font-semibold text-white ring-2 ring-white/70"
              style={{ backgroundColor: c.palette.solid }}
            >
              {initials(c.name)}
            </span>
            <span className="max-w-[9rem] truncate">
              {c.name}
              {c.id === userId && <span className="ml-1 font-normal opacity-55">(sen)</span>}
            </span>
            <span className="font-mono text-[11px] tabular-nums opacity-60">{c.count}</span>
          </button>
        )
      })}
    </div>
  )
}
