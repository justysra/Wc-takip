import { TOTAL_SLOTS, withPossessive } from '../lib/slots'

export default function ProgressBar({ filled }) {
  const ratio = filled / TOTAL_SLOTS
  const percent = Math.floor(ratio * 100)

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="flex-1 text-[13px] text-slate-500 sm:flex-none">
        <span className="font-medium text-slate-800 tabular-nums">
          {TOTAL_SLOTS} slotun {withPossessive(filled)}
        </span>{' '}
        kilitlendi
      </p>

      <span className="font-mono text-[13px] font-medium text-slate-700 tabular-nums sm:order-last sm:w-11 sm:text-right">
        %{percent}
      </span>

      <div
        className="relative order-last h-1.5 w-full rounded-full bg-slate-200 sm:order-none sm:w-auto sm:flex-1"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={TOTAL_SLOTS}
        aria-valuenow={filled}
        aria-label={`${TOTAL_SLOTS} slotun ${withPossessive(filled)} kilitlendi`}
      >
        <div
          className="h-full rounded-full bg-slate-800 transition-[width] duration-700 ease-out"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  )
}
