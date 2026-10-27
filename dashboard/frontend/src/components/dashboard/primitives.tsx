import type { ReactNode } from 'react'
import type { Eda, Filters } from '../../data/eda'

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[1.5rem] border border-forest-900/10 bg-cream-50 p-5 shadow-[0_1px_0_rgba(4,22,15,0.04)] transition-[border-color,box-shadow] duration-300 hover:border-forest-900/15 hover:shadow-[0_24px_50px_-42px_rgba(4,22,15,0.5)] md:p-6 ${className}`}
    >
      {children}
    </section>
  )
}

export function PanelHead({
  kicker,
  title,
  note,
  action,
}: {
  kicker: string
  title: string
  note?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="eyebrow text-[0.55rem] text-forest-900/40">{kicker}</p>
        <h2 className="mt-1.5 font-display text-lg font-medium tracking-tight text-forest-950 md:text-xl">
          {title}
        </h2>
        {note ? (
          <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-forest-900/50">{note}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function Kpi({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-forest-900/10 bg-cream-50 p-5">
      <span
        aria-hidden="true"
        className="absolute right-0 top-0 h-16 w-16 translate-x-6 -translate-y-6 rounded-full bg-lime-300/25 blur-xl"
      />
      <p className="eyebrow text-[0.55rem] text-forest-900/45">{label}</p>
      <p className="mt-3 font-display text-[1.7rem] font-medium leading-none tracking-tight text-forest-950 md:text-3xl">
        {value}
      </p>
      <p className="mt-2.5 text-[0.7rem] leading-relaxed text-forest-900/50">{note}</p>
    </article>
  )
}

type FilterKey = keyof Filters

const filterConfig: {
  key: FilterKey
  label: string
  options: (eda: Eda) => string[]
  format?: (value: string) => string
}[] = [
  { key: 'variety', label: 'Variety', options: (eda) => eda.meta.varieties },
  { key: 'soil', label: 'Soil', options: (eda) => eda.meta.soils },
  { key: 'block', label: 'Agriblock', options: (eda) => eda.meta.blocks },
  { key: 'nursery', label: 'Nursery', options: (eda) => eda.meta.nurseries },
  {
    key: 'size',
    label: 'Plot size',
    options: () => ['1', '2', '3', '4', '5', '6'],
    format: (value) => `${value} ha`,
  },
]

const filterLabels = Object.fromEntries(
  filterConfig.map((item) => [item.key, item.label]),
) as Record<FilterKey, string>

function filterDisplay(key: FilterKey, value: string) {
  const format = filterConfig.find((item) => item.key === key)?.format
  return format ? format(value) : value
}

export function FilterBar({
  eda,
  filters,
  onChange,
  onReset,
  count,
}: {
  eda: Eda
  filters: Filters
  onChange: (key: FilterKey, value: string) => void
  onReset: () => void
  count: number
}) {
  const active = (Object.entries(filters) as [FilterKey, string][]).filter(
    ([, value]) => value !== 'all',
  )

  return (
    <div className="rounded-[1.5rem] border border-forest-900/10 bg-cream-50/90 p-4 shadow-[0_18px_40px_-36px_rgba(4,22,15,0.4)] backdrop-blur md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow text-[0.55rem] text-forest-900/45">Slice the dataset</p>
        <p aria-live="polite" className="text-[0.68rem] tabular-nums text-forest-900/50">
          {count.toLocaleString('en-US')} of {eda.meta.rowsClean.toLocaleString('en-US')} plots
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
        {filterConfig.map((item) => (
          <label key={item.key} className="group relative block">
            <span className="eyebrow mb-1.5 block text-[0.5rem] text-forest-900/40">
              {item.label}
            </span>
            <select
              aria-label={item.label}
              value={filters[item.key]}
              onChange={(event) => onChange(item.key, event.target.value)}
              className="w-full appearance-none rounded-xl border border-forest-900/15 bg-cream-100/70 py-2.5 pl-3 pr-8 text-[0.78rem] font-medium text-forest-950 outline-none transition-colors focus:border-leaf-500 focus:bg-cream-50"
            >
              <option value="all">All</option>
              {item.options(eda).map((option) => (
                <option key={option} value={option}>
                  {item.format ? item.format(option) : option}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 10 10"
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3.5 right-3 h-2.5 w-2.5 text-forest-900/50"
              fill="none"
            >
              <path
                d="m2 4 3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </label>
        ))}

        <button
          type="button"
          onClick={onReset}
          disabled={active.length === 0}
          className="col-span-2 mt-auto inline-flex h-[42px] items-center justify-center self-end rounded-xl border border-forest-900/15 px-4 text-[0.72rem] font-semibold text-forest-900/70 transition-colors hover:border-forest-900/35 hover:text-forest-950 disabled:cursor-not-allowed disabled:opacity-35 sm:col-span-1 lg:col-span-1 lg:w-auto"
        >
          Reset {active.length > 0 ? `(${active.length})` : ''}
        </button>
      </div>

      {active.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-forest-900/10 pt-3">
          <span className="eyebrow mr-1 text-[0.46rem] text-forest-900/35">Active</span>
          {active.map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key, 'all')}
              aria-label={`Remove ${filterLabels[key]} filter ${filterDisplay(key, value)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-forest-900/12 bg-cream-100/80 py-1 pl-2.5 pr-2 text-[0.62rem] font-semibold text-forest-900/65 transition-colors hover:border-forest-900/30 hover:text-forest-950"
            >
              <span className="text-forest-900/40">{filterLabels[key]}:</span>
              {filterDisplay(key, value)}
              <svg viewBox="0 0 8 8" aria-hidden="true" className="h-2 w-2" fill="none">
                <path
                  d="m1.5 1.5 5 5m0-5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-full border border-forest-900/12 bg-cream-100/70 p-1"
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-[0.66rem] font-semibold transition-colors ${
              selected
                ? 'bg-forest-900 text-cream-50'
                : 'text-forest-900/55 hover:text-forest-950'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
