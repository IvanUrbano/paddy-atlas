import { useMemo, useState } from 'react'
import { COLUMN, type Eda } from '../../data/eda'
import { correlation, correlation3, int } from '../../lib/format'
import { groupStats, mean, median, pearson } from '../../lib/stats'
import { Panel, PanelHead, Segmented } from './primitives'

type RowFeature = { label: string; get: (row: number[]) => number }

const dimensions: RowFeature[] = [
  { label: 'Plot size', get: (row) => row[COLUMN.hectares] },
  { label: 'Seed rate', get: (row) => row[COLUMN.seedrate] },
  { label: 'Urea', get: (row) => row[COLUMN.urea] },
  { label: 'Pest ctrl', get: (row) => row[COLUMN.pest] },
  { label: 'Season rain', get: (row) => row[COLUMN.rainTotal] },
  { label: 'Humidity', get: (row) => row[COLUMN.humidity] },
  { label: 'Wind', get: (row) => row[COLUMN.wind] },
  { label: 'Temp range', get: (row) => row[COLUMN.tempRange] },
]

function cellColor(value: number) {
  const strength = Math.min(1, Math.abs(value))
  const alpha = 0.06 + strength * 0.86
  return value >= 0 ? `rgba(47, 125, 79, ${alpha})` : `rgba(138, 90, 59, ${alpha})`
}

export function CorrelationGrid({ rows }: { rows: number[][] }) {
  const [outcome, setOutcome] = useState<'total' | 'perHa'>('total')
  const features = useMemo<RowFeature[]>(
    () => [
      ...dimensions,
      {
        label: outcome === 'total' ? 'Yield' : 'Yield/ha',
        get:
          outcome === 'total'
            ? (row) => row[COLUMN.yield]
            : (row) => row[COLUMN.yield] / row[COLUMN.hectares],
      },
    ],
    [outcome],
  )
  const matrix = useMemo(() => {
    return features.map((rowFeature) =>
      features.map((columnFeature) =>
        pearson(rows.map(rowFeature.get), rows.map(columnFeature.get)),
      ),
    )
  }, [features, rows])
  const insufficient = rows.length < 2
  const constants = features.map(
    (feature) => new Set(rows.map(feature.get)).size < 2,
  )
  const hasConstant = constants.some(Boolean)
  const title =
    insufficient
      ? 'Not enough plots for a matrix'
      : hasConstant
        ? 'Constant inputs break the matrix'
        : outcome === 'total'
          ? 'Total yield tracks scale'
          : 'Per-hectare correlations are weaker'
  const note =
    insufficient
      ? 'At least two plots are needed to compute correlations.'
      : hasConstant
        ? 'At least one variable is constant in this view, so correlations involving it are undefined and shown as —.'
        : outcome === 'total'
          ? 'Total yield and inputs that scale with area cluster near +1. Weather correlations are near zero. Association is not causation.'
          : 'Area is divided out, but yield per hectare still correlates with plot size. Weather correlations remain near zero.'

  if (rows.length === 0) {
    return (
      <Panel className="flex h-full flex-col">
        <PanelHead
          kicker="Collinearity"
          title="No plots to correlate"
          note="Correlations need at least two plots. Clear or widen a filter to restore the matrix."
        />
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-forest-900/15 p-6 text-center text-xs text-forest-900/45">
          No plots match the current filters.
        </div>
      </Panel>
    )
  }

  return (
    <Panel>
      <PanelHead
        kicker="Collinearity"
        title={title}
        note={note}
        action={
          <Segmented
            label="Correlation outcome"
            value={outcome}
            onChange={setOutcome}
            options={[
              { value: 'total', label: 'Total yield' },
              { value: 'perHa', label: 'Per hectare' },
            ]}
          />
        }
      />
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[440px]">
          <div className="grid grid-cols-[76px_repeat(9,minmax(0,1fr))] gap-1">
            <span aria-hidden="true" />
            {features.map((feature) => (
              <span
                key={feature.label}
                className="flex h-8 items-end justify-center pb-1 text-center text-[0.52rem] font-semibold leading-[1.1] text-forest-900/55"
              >
                {feature.label}
              </span>
            ))}

            {features.map((rowFeature, rowIndex) => (
              <div key={rowFeature.label} className="contents">
                <span className="flex items-center text-[0.56rem] font-semibold text-forest-900/55">
                  {rowFeature.label}
                </span>
                {features.map((columnFeature, columnIndex) => {
                  const value = matrix[rowIndex][columnIndex]
                  const isDiagonal = rowIndex === columnIndex
                  const defined = !insufficient && !constants[rowIndex] && !constants[columnIndex]
                  return (
                    <span
                      key={columnFeature.label}
                      title={
                        defined
                          ? `${rowFeature.label} × ${columnFeature.label}: r = ${correlation(value)}`
                          : `${rowFeature.label} × ${columnFeature.label}: correlation undefined (constant input)`
                      }
                      className={`flex aspect-square items-center justify-center rounded-[4px] text-[0.54rem] font-semibold tabular-nums transition-transform duration-200 hover:scale-[1.06] ${
                        !defined
                          ? 'text-forest-900/30'
                          : Math.abs(value) > 0.55
                            ? 'text-cream-50'
                            : 'text-forest-950'
                      }`}
                      style={{
                        backgroundColor: !defined
                          ? 'rgba(16, 69, 47, 0.06)'
                          : isDiagonal
                            ? '#10452f'
                            : cellColor(value),
                      }}
                    >
                      {!defined ? '—' : isDiagonal ? '1' : correlation(value).replace('0.', '.')}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.6rem] text-forest-900/45">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-clay-500/70" /> Negative
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-leaf-500/70" /> Positive
        </span>
        <span>
          {insufficient
            ? 'At least two plots are needed for a correlation.'
            : hasConstant
              ? 'Undefined correlations involving a constant input display as —.'
              : `Values are Pearson r on the current view. Outcome: ${
                  outcome === 'total' ? 'total yield' : 'yield per hectare'
                }.`}
        </span>
      </div>
    </Panel>
  )
}

export function SummaryTable({ rows, eda }: { rows: number[][]; eda: Eda }) {
  const groups = useMemo(
    () => [
      { title: 'Variety', stats: groupStats(rows, COLUMN.variety, eda.meta.varieties) },
      { title: 'Soil', stats: groupStats(rows, COLUMN.soil, eda.meta.soils) },
      { title: 'Agriblock', stats: groupStats(rows, COLUMN.block, eda.meta.blocks) },
    ],
    [rows, eda.meta],
  )

  const totals = useMemo(() => {
    const yields = rows.map((row) => row[COLUMN.yield])
    return {
      count: rows.length,
      mean: mean(yields),
      middle: median(yields),
      perHa: mean(rows.map((row) => row[COLUMN.yield] / row[COLUMN.hectares])),
    }
  }, [rows])

  return (
    <Panel className="flex h-full flex-col overflow-hidden">
      <PanelHead
        kicker="Group summary"
        title="Averages by category"
        note="Computed live from the filtered plots. Per-hectare means differ far less than total-yield means, but plot size still matters."
      />
      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-forest-900/15 p-6 text-center text-xs text-forest-900/45">
          No plots match the current filters.
        </div>
      ) : (
        <>
          <div className="-mx-5 overflow-x-auto md:-mx-6">
            <table className="w-full min-w-[520px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-forest-900/10 text-[0.56rem] uppercase tracking-[0.14em] text-forest-900/40">
                  <th className="px-5 py-2.5 font-semibold md:px-6">Group</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Plots</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Mean yield</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Median</th>
                  <th className="px-5 py-2.5 text-right font-semibold md:px-6">Per hectare</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-forest-900/75">
                <tr className="border-b border-forest-900/8 bg-lime-300/15">
                  <th scope="row" className="px-5 py-2.5 text-left font-semibold text-forest-950 md:px-6">
                    All plots
                  </th>
                  <td className="px-3 py-2.5 text-right">{int(totals.count)}</td>
                  <td className="px-3 py-2.5 text-right">{int(totals.mean)}</td>
                  <td className="px-3 py-2.5 text-right">{int(totals.middle)}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-forest-950 md:px-6">
                    {int(totals.perHa)}
                  </td>
                </tr>
                {groups.map((group) => (
                  <GroupRows key={group.title} title={group.title} stats={group.stats} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[0.64rem] leading-relaxed text-forest-900/45">
            Values in kilograms. Per-hectare is the mean of each plot&apos;s yield divided by its area.
          </p>
        </>
      )}
    </Panel>
  )
}

function GroupRows({
  title,
  stats,
}: {
  title: string
  stats: ReturnType<typeof groupStats>
}) {
  return (
    <>
      <tr>
        <th
          scope="colgroup"
          colSpan={5}
          className="border-b border-forest-900/8 bg-cream-100/60 px-5 pb-1.5 pt-4 text-left text-[0.52rem] font-semibold uppercase tracking-[0.18em] text-forest-900/40 md:px-6"
        >
          {title}
        </th>
      </tr>
      {stats.map((stat) => (
        <tr key={stat.name} className="border-b border-forest-900/6 last:border-0">
          <th scope="row" className="px-5 py-2.5 text-left font-medium text-forest-900/80 md:px-6">
            {stat.name}
          </th>
          <td className="px-3 py-2.5 text-right">{int(stat.count)}</td>
          <td className="px-3 py-2.5 text-right">{int(stat.meanYield)}</td>
          <td className="px-3 py-2.5 text-right">{int(stat.medianYield)}</td>
          <td className="px-5 py-2.5 text-right font-semibold text-forest-950 md:px-6">
            {int(stat.perHa)}
          </td>
        </tr>
      ))}
    </>
  )
}

export function QualityPanel({ eda }: { eda: Eda }) {
  const wind = eda.audit.windLow
  const windBlocks = Object.keys(wind.blocks).join(', ')
  const windRange = `${Math.min(...wind.values)}–${wind.max}`
  const items = [
    {
      label: 'Missing values',
      value: '0',
      note: `All ${int(eda.meta.rowsClean * eda.meta.columns)} cells populated across ${eda.meta.columns} variables — 100% complete.`,
    },
    {
      label: 'Duplicates removed',
      value: int(eda.meta.duplicates),
      note: `Raw ${int(eda.meta.rowsRaw)} rows reduced to ${int(eda.meta.rowsClean)} unique plots.`,
    },
    {
      label: 'Wind outliers',
      value: `${wind.count} rows`,
      note: `${wind.share}% of plots at ${wind.window} record ${wind.value} knots, all in ${windBlocks}. Across all blocks this window spans ${windRange} knots; the values were retained as block-level variation.`,
    },
    {
      label: 'Early rain range',
      value: `${eda.audit.rainFirstWindow.min}–${eda.audit.rainFirstWindow.max} mm`,
      note: 'D1–30 rainfall spans 1.5 mm across blocks, so within-window variation is low.',
    },
  ]

  return (
    <Panel>
      <PanelHead
        kicker="Data quality"
        title="What the audit changed"
        note="Cleaning decisions and their effect on the analysis."
      />
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex gap-4 rounded-xl border border-forest-900/8 bg-cream-100/40 p-3.5"
          >
            <div className="shrink-0">
              <p className="font-display text-lg font-medium leading-none text-forest-950">
                {item.value}
              </p>
              <p className="eyebrow mt-1.5 text-[0.48rem] text-forest-900/40">{item.label}</p>
            </div>
            <p className="text-[0.68rem] leading-relaxed text-forest-900/55">{item.note}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-xl bg-forest-950 p-4 text-cream-50">
        <p className="eyebrow text-[0.5rem] text-lime-300/70">Key caveat</p>
        <p className="mt-2 text-[0.7rem] leading-relaxed text-cream-50/70">
          Plot size and total yield correlate at r ={' '}
          {correlation3(eda.audit.hectaresYieldCorrelation)}. Yield per hectare still correlates
          with size at r = {correlation3(eda.audit.hectaresYieldPerHaCorrelation)}; normalising
          reduces the scale effect but does not remove it.
        </p>
        <p className="mt-2.5 text-[0.62rem] text-cream-50/45">
          Variety means span {eda.audit.perHectareSpread.min.toFixed(0)}–
          {eda.audit.perHectareSpread.max.toFixed(0)} kg/ha; size-group means span{' '}
          {eda.audit.perHectareSizeSpread.min.toFixed(0)}–
          {eda.audit.perHectareSizeSpread.max.toFixed(0)} kg/ha.
        </p>
      </div>
    </Panel>
  )
}
