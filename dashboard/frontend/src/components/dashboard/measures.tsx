import { useMemo, useState } from 'react'
import { COLUMN, type Eda } from '../../data/eda'
import { decimal, int } from '../../lib/format'
import {
  excessKurtosis,
  iqrOutliers,
  median,
  quantile,
  skewness,
  summarize,
} from '../../lib/stats'
import { Panel, PanelHead, Segmented } from './primitives'

type Measure = {
  label: string
  unit: string
  digits: number
  get: (row: number[]) => number
}

const MEASURES: Measure[] = [
  { label: 'Yield', unit: 'kg', digits: 0, get: (row) => row[COLUMN.yield] },
  {
    label: 'Yield per hectare',
    unit: 'kg/ha',
    digits: 0,
    get: (row) => row[COLUMN.yield] / row[COLUMN.hectares],
  },
  { label: 'Plot size', unit: 'ha', digits: 1, get: (row) => row[COLUMN.hectares] },
  { label: 'Seed rate', unit: 'kg', digits: 0, get: (row) => row[COLUMN.seedrate] },
  { label: 'Urea at 40 days', unit: 'kg', digits: 0, get: (row) => row[COLUMN.urea] },
  { label: 'Season rain', unit: 'mm', digits: 1, get: (row) => row[COLUMN.rainTotal] },
  { label: 'Humidity', unit: '%', digits: 1, get: (row) => row[COLUMN.humidity] },
]

function formatValue(value: number, digits: number) {
  return digits === 0 ? int(value) : decimal(value, digits)
}

function signed(value: number, digits: number) {
  const formatted = formatValue(Math.abs(value), digits)
  if (Math.abs(value) < (digits === 0 ? 0.5 : 0.05)) return '0'
  return `${value > 0 ? '+' : '−'}${formatted}`
}

export function CentralTendencyPanel({ rows }: { rows: number[][] }) {
  const data = useMemo(
    () =>
      MEASURES.map((measure) => ({
        measure,
        summary: summarize(rows.map(measure.get)),
      })),
    [rows],
  )

  const heading = (
    <PanelHead
      kicker="Central tendency"
      title="Where the data settles"
      note="Mean, median and the middle half of each variable. A mean below the median points to a left tail of unusually low plots."
    />
  )

  if (rows.length === 0) {
    return (
      <Panel className="flex h-full flex-col">
        {heading}
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-forest-900/15 p-6 text-center text-xs text-forest-900/45">
          No plots match the current filters.
        </div>
      </Panel>
    )
  }

  return (
    <Panel className="h-full">
      {heading}
      <div className="-mx-5 overflow-x-auto md:-mx-6">
        <table className="w-full min-w-[560px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-forest-900/10 text-[0.54rem] uppercase tracking-[0.14em] text-forest-900/40">
              <th className="px-5 py-2.5 font-semibold md:px-6">Variable</th>
              <th className="px-3 py-2.5 text-right font-semibold">Mean</th>
              <th className="px-3 py-2.5 text-right font-semibold">Median</th>
              <th className="px-3 py-2.5 text-right font-semibold">Q1</th>
              <th className="px-3 py-2.5 text-right font-semibold">Q3</th>
              <th className="px-5 py-2.5 text-right font-semibold md:px-6">Mean − median</th>
            </tr>
          </thead>
          <tbody className="tabular-nums text-forest-900/75">
            {data.map(({ measure, summary }) => {
              const gap = summary.mean - summary.median
              return (
                <tr key={measure.label} className="border-b border-forest-900/6 last:border-0">
                  <th scope="row" className="px-5 py-2.5 text-left font-medium text-forest-900/80 md:px-6">
                    {measure.label}
                    <span className="ml-1.5 text-[0.6rem] font-normal text-forest-900/35">
                      {measure.unit}
                    </span>
                  </th>
                  <td className="px-3 py-2.5 text-right font-semibold text-forest-950">
                    {formatValue(summary.mean, measure.digits)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {formatValue(summary.median, measure.digits)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-forest-900/55">
                    {formatValue(summary.q1, measure.digits)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-forest-900/55">
                    {formatValue(summary.q3, measure.digits)}
                  </td>
                  <td
                    className={`px-5 py-2.5 text-right md:px-6 ${
                      gap < 0 ? 'text-clay-600' : 'text-forest-900/45'
                    }`}
                  >
                    {signed(gap, measure.digits)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[0.64rem] leading-relaxed text-forest-900/45">
        Quartiles use linear interpolation. Values describe the plots currently passing the filters.
      </p>
    </Panel>
  )
}

const FREQUENCY_DIMENSIONS = [
  {
    label: 'Variety',
    value: 'variety',
    index: COLUMN.variety,
    levels: (eda: Eda) => eda.meta.varieties.map((label, value) => ({ label, value })),
  },
  {
    label: 'Soil',
    value: 'soil',
    index: COLUMN.soil,
    levels: (eda: Eda) => eda.meta.soils.map((label, value) => ({ label, value })),
  },
  {
    label: 'Block',
    value: 'block',
    index: COLUMN.block,
    levels: (eda: Eda) => eda.meta.blocks.map((label, value) => ({ label, value })),
  },
  {
    label: 'Nursery',
    value: 'nursery',
    index: COLUMN.nursery,
    levels: (eda: Eda) => eda.meta.nurseries.map((label, value) => ({ label, value })),
  },
  {
    label: 'Plot size',
    value: 'size',
    index: COLUMN.hectares,
    levels: () => [1, 2, 3, 4, 5, 6].map((value) => ({ label: `${value} ha`, value })),
  },
] as const

type FrequencyDimension = (typeof FREQUENCY_DIMENSIONS)[number]['value']

export function FrequencyPanel({ rows, eda }: { rows: number[][]; eda: Eda }) {
  const [dimension, setDimension] = useState<FrequencyDimension>('variety')
  const config = FREQUENCY_DIMENSIONS.find((item) => item.value === dimension)!
  const labels = config.levels(eda)

  const data = useMemo(() => {
    const counts = new Map<number, number>()
    rows.forEach((row) => {
      const value = row[config.index]
      counts.set(value, (counts.get(value) ?? 0) + 1)
    })
    return labels
      .map(({ label, value }) => {
        const count = counts.get(value) ?? 0
        return {
          label,
          count,
          share: rows.length ? (count / rows.length) * 100 : 0,
        }
      })
      .sort((left, right) => right.count - left.count)
  }, [rows, labels, config.index])

  const modeCount = data[0]?.count ?? 0
  const distinct = data.filter((item) => item.count > 0).length

  return (
    <Panel className="flex h-full flex-col">
      <PanelHead
        kicker="Frequency distribution"
        title="Category mix"
        note="Every level, ranked by count and share of the plots currently in view."
        action={
          <Segmented
            label="Frequency dimension"
            value={dimension}
            options={FREQUENCY_DIMENSIONS.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            onChange={(value) => setDimension(value as FrequencyDimension)}
          />
        }
      />
      <ul className="space-y-2.5">
        {data.map((item) => {
          const isMode = item.count > 0 && item.count === modeCount
          return (
            <li key={item.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5 text-[0.72rem] font-medium text-forest-950">
                  <span className="truncate">{item.label}</span>
                  {isMode ? (
                    <span className="rounded-full bg-lime-300/75 px-1.5 py-px text-[0.44rem] font-bold uppercase tracking-[0.12em] text-forest-950">
                      Mode
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-[0.68rem] tabular-nums text-forest-900/50">
                  <span className="font-semibold text-forest-950">{int(item.count)}</span>
                  <span className="ml-1.5">{decimal(item.share, 1)}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forest-900/8">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${
                    isMode ? 'bg-leaf-500' : 'bg-leaf-500/45'
                  }`}
                  style={{ width: `${Math.min(100, item.share)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-auto pt-4 text-[0.64rem] leading-relaxed text-forest-900/45">
        {rows.length > 0
          ? `${distinct} of ${data.length} levels present · ${int(rows.length)} ${
              rows.length === 1 ? 'plot' : 'plots'
            } in view. Multiple Mode tags mean a tie.`
          : 'No plots match the current filters.'}
      </p>
    </Panel>
  )
}

const SHAPE_MEASURES = [
  { label: 'Total yield', unit: 'kg', get: (row: number[]) => row[COLUMN.yield] },
  {
    label: 'Yield per hectare',
    unit: 'kg/ha',
    get: (row: number[]) => row[COLUMN.yield] / row[COLUMN.hectares],
  },
]

function skewLabel(value: number) {
  if (Math.abs(value) < 0.5) return 'Roughly symmetric'
  return value > 0 ? 'Right-skewed' : 'Left-skewed'
}

function tailLabel(value: number) {
  if (Math.abs(value) < 0.5) return 'Near-normal tails'
  return value > 0 ? 'Heavier tails' : 'Lighter tails'
}

export function ShapePanel({ rows }: { rows: number[][] }) {
  const enoughForSkew = rows.length >= 3
  const enoughForKurtosis = rows.length >= 4
  const enoughForOutliers = rows.length >= 3
  const data = useMemo(
    () =>
      SHAPE_MEASURES.map((measure) => {
        const values = rows.map(measure.get)
        const outliers = iqrOutliers(values)
        return {
          ...measure,
          skew: skewness(values),
          kurtosis: excessKurtosis(values),
          outliers: outliers.count,
          lowFence: outliers.low,
          highFence: outliers.high,
          p10: quantile(values, 0.1),
          p90: quantile(values, 0.9),
        }
      }),
    [rows],
  )

  return (
    <Panel className="h-full">
      <PanelHead
        kicker="Distribution shape"
        title="Skew, tails and outliers"
        note="Skewness and excess kurtosis describe symmetry and tail weight. Outliers use 1.5×IQR fences."
      />
      {rows.length > 0 ? (
        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-forest-900/8 bg-cream-100/45 p-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[0.72rem] font-semibold text-forest-950">{item.label}</p>
                {enoughForSkew && enoughForKurtosis ? (
                  <div className="flex flex-wrap gap-1">
                    <span className="rounded-full bg-forest-900/6 px-2 py-0.5 text-[0.54rem] font-semibold text-forest-900/60">
                      {skewLabel(item.skew)}
                    </span>
                    <span className="rounded-full bg-forest-900/6 px-2 py-0.5 text-[0.54rem] font-semibold text-forest-900/60">
                      {tailLabel(item.kurtosis)}
                    </span>
                  </div>
                ) : (
                  <span className="rounded-full bg-forest-900/6 px-2 py-0.5 text-[0.54rem] font-semibold text-forest-900/60">
                    Too few plots for shape statistics
                  </span>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2">
                <div>
                  <dt className="eyebrow text-[0.44rem] text-forest-900/35">Skewness</dt>
                  <dd className="mt-1 text-sm font-semibold tabular-nums text-forest-950">
                    {enoughForSkew ? decimal(item.skew, 2) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-[0.44rem] text-forest-900/35">Ex. kurtosis</dt>
                  <dd className="mt-1 text-sm font-semibold tabular-nums text-forest-950">
                    {enoughForKurtosis ? decimal(item.kurtosis, 2) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-[0.44rem] text-forest-900/35">IQR outliers</dt>
                  <dd className="mt-1 text-sm font-semibold tabular-nums text-forest-950">
                    {enoughForOutliers ? int(item.outliers) : '—'}
                  </dd>
                </div>
              </dl>
              {enoughForOutliers ? (
                <p className="mt-2.5 text-[0.58rem] leading-relaxed text-forest-900/45">
                  P10–P90 {int(item.p10)}–{int(item.p90)} {item.unit} · fences{' '}
                  {int(item.lowFence)}–{int(item.highFence)} {item.unit}
                </p>
              ) : (
                <p className="mt-2.5 text-[0.58rem] leading-relaxed text-forest-900/45">
                  At least three plots are needed to describe this distribution.
                </p>
              )}
            </div>
          ))}
          <p className="text-[0.64rem] leading-relaxed text-forest-900/45">
            {enoughForOutliers
              ? 'Zero IQR outliers does not mean no extremes: the fences sit outside the observed range because the distribution is bounded and tightly clustered.'
              : 'At least three plots are needed before skew, tails and fences become meaningful.'}
          </p>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-forest-900/15 p-6 text-center text-sm text-forest-900/45">
          No plots match the current filters.
        </p>
      )}
    </Panel>
  )
}

export function DispersionPanel({ rows }: { rows: number[][] }) {
  const data = useMemo(
    () =>
      MEASURES.map((measure) => ({
        measure,
        summary: summarize(rows.map(measure.get)),
      })),
    [rows],
  )

  const heading = (
    <PanelHead
      kicker="Dispersion"
      title="The spread, column by column"
      note="Range is the full span; IQR is the middle half; SD is the typical distance from the mean; CV rescales spread by the mean."
    />
  )

  if (rows.length === 0) {
    return (
      <Panel className="flex h-full flex-col">
        {heading}
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-forest-900/15 p-6 text-center text-xs text-forest-900/45">
          No plots match the current filters.
        </div>
      </Panel>
    )
  }

  return (
    <Panel className="h-full">
      {heading}
      <div className="-mx-5 overflow-x-auto md:-mx-6">
        <table className="w-full min-w-[600px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-forest-900/10 text-[0.54rem] uppercase tracking-[0.14em] text-forest-900/40">
              <th className="px-5 py-2.5 font-semibold md:px-6">Variable</th>
              <th className="px-3 py-2.5 text-right font-semibold">Min</th>
              <th className="px-3 py-2.5 text-right font-semibold">Max</th>
              <th className="px-3 py-2.5 text-right font-semibold">Range</th>
              <th className="px-3 py-2.5 text-right font-semibold">IQR</th>
              <th className="px-3 py-2.5 text-right font-semibold">SD</th>
              <th className="px-5 py-2.5 text-right font-semibold md:px-6">CV</th>
            </tr>
          </thead>
          <tbody className="tabular-nums text-forest-900/75">
            {data.map(({ measure, summary }) => (
              <tr key={measure.label} className="border-b border-forest-900/6 last:border-0">
                <th scope="row" className="px-5 py-2.5 text-left font-medium text-forest-900/80 md:px-6">
                  {measure.label}
                  <span className="ml-1.5 text-[0.6rem] font-normal text-forest-900/35">
                    {measure.unit}
                  </span>
                </th>
                <td className="px-3 py-2.5 text-right text-forest-900/55">
                  {formatValue(summary.min, measure.digits)}
                </td>
                <td className="px-3 py-2.5 text-right text-forest-900/55">
                  {formatValue(summary.max, measure.digits)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {formatValue(summary.range, measure.digits)}
                </td>
                <td className="px-3 py-2.5 text-right">{formatValue(summary.iqr, measure.digits)}</td>
                <td className="px-3 py-2.5 text-right">{formatValue(summary.sd, measure.digits)}</td>
                <td className="px-5 py-2.5 text-right font-semibold text-forest-950 md:px-6">
                  {decimal(summary.cv, 1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[0.64rem] leading-relaxed text-forest-900/45">
        SD is the sample standard deviation, so variance = SD². CV = SD ÷ mean, so variables
        measured on different scales can be compared.
      </p>
    </Panel>
  )
}

type Dimension = 'variety' | 'soil' | 'block' | 'size'

const DIMENSIONS: {
  value: Dimension
  label: string
  index: number
  levels: (eda: Eda) => { label: string; value: number }[]
}[] = [
  {
    value: 'variety',
    label: 'Variety',
    index: COLUMN.variety,
    levels: (eda) => eda.meta.varieties.map((label, value) => ({ label, value })),
  },
  {
    value: 'soil',
    label: 'Soil',
    index: COLUMN.soil,
    levels: (eda) => eda.meta.soils.map((label, value) => ({ label, value })),
  },
  {
    value: 'block',
    label: 'Agriblock',
    index: COLUMN.block,
    levels: (eda) => eda.meta.blocks.map((label, value) => ({ label, value })),
  },
  {
    value: 'size',
    label: 'Plot size',
    index: COLUMN.hectares,
    levels: () => [1, 2, 3, 4, 5, 6].map((value) => ({ label: `${value} ha`, value })),
  },
]

export function DispersionBox({ rows, eda }: { rows: number[][]; eda: Eda }) {
  const [dimension, setDimension] = useState<Dimension>('size')
  const config = DIMENSIONS.find((item) => item.value === dimension) ?? DIMENSIONS[0]
  const labels = config.levels(eda)

  const groups = useMemo(
    () =>
      labels.flatMap(({ label, value }) => {
        const values = rows
          .filter((row) => row[config.index] === value)
          .map((row) => row[COLUMN.yield] / row[COLUMN.hectares])
        return values.length > 0 ? [{ label, ...summarize(values) }] : []
      }),
    [rows, labels, config.index],
  )

  const allValues = useMemo(
    () => rows.map((row) => row[COLUMN.yield] / row[COLUMN.hectares]),
    [rows],
  )
  const overallMedian = median(allValues)

  const low = allValues.length ? Math.floor(Math.min(...allValues) / 50) * 50 : 0
  const highValue = allValues.length ? Math.ceil(Math.max(...allValues) / 50) * 50 : 50
  const high = highValue === low ? low + 50 : highValue
  const span = high - low
  const position = (value: number) => Math.max(0, Math.min(100, ((value - low) / span) * 100))

  return (
    <Panel className="h-full">
      <PanelHead
        kicker="Spread by category"
        title={dimension === 'size' ? 'Per-hectare spread by plot size' : 'The middle 50%, group by group'}
        note="Each row rescales to the filtered per-hectare values. Whiskers span the minimum and maximum; the box is Q1–Q3; the line is the median."
        action={
          <Segmented
            label="Grouping for dispersion"
            value={dimension}
            onChange={setDimension}
            options={DIMENSIONS.map((item) => ({ value: item.value, label: item.label }))}
          />
        }
      />
      {groups.length > 0 ? (
        <div
          role="img"
          aria-label={`Per-hectare yield ranges by ${config.label.toLowerCase()}: ${groups
            .map((group) => `${group.label} median ${int(group.median)}`)
            .join(', ')}`}
        >
          <div className="mb-2 grid grid-cols-[minmax(64px,88px)_1fr_40px_52px] gap-2.5 text-[0.52rem] uppercase tracking-[0.12em] text-forest-900/35">
            <span>Group</span>
            <span />
            <span className="text-right">n</span>
            <span className="text-right">Median</span>
          </div>
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.label}
                className="grid grid-cols-[minmax(64px,88px)_1fr_40px_52px] items-center gap-2.5"
                title={`${group.label}: n ${group.count}, min ${int(group.min)}, Q1 ${int(
                  group.q1,
                )}, median ${int(group.median)}, Q3 ${int(group.q3)}, max ${int(group.max)} kg/ha`}
              >
                <span className="truncate text-[0.68rem] font-medium text-forest-900/70">
                  {group.label}
                </span>
                <div className="relative h-6">
                  <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-forest-900/10" />
                  <div
                    className="absolute top-1/2 h-px -translate-y-1/2 bg-forest-900/35"
                    style={{ left: `${position(group.min)}%`, right: `${100 - position(group.max)}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3.5 -translate-y-1/2 rounded-[3px] border border-leaf-600/40 bg-leaf-500/30"
                    style={{ left: `${position(group.q1)}%`, right: `${100 - position(group.q3)}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-5 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest-900"
                    style={{ left: `${position(group.median)}%` }}
                  />
                  <div
                    className="absolute inset-y-1 w-px border-l border-dashed border-clay-500/50"
                    style={{ left: `${position(overallMedian)}%` }}
                  />
                </div>
                <span className="text-right text-[0.6rem] tabular-nums text-forest-900/45">
                  {int(group.count)}
                </span>
                <span className="text-right text-[0.64rem] font-semibold tabular-nums text-forest-950">
                  {int(group.median)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-between border-t border-forest-900/10 pt-2 text-[0.56rem] tabular-nums text-forest-900/40">
            <span>{int(low)} kg/ha</span>
            <span>{int(high)} kg/ha</span>
          </div>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-forest-900/15 text-xs text-forest-900/45">
          No plots match these filters.
        </div>
      )}
      <p className="mt-3 text-[0.64rem] leading-relaxed text-forest-900/45">
        {groups.length > 0
          ? `Dashed line marks the overall median (${int(
              overallMedian,
            )} kg/ha). Overlapping boxes show that the group distributions overlap on this scale; they do not establish equivalence.`
          : 'No plots match the current filters, so no distribution is shown.'}
      </p>
    </Panel>
  )
}

export function DispersionContrast({ rows }: { rows: number[][] }) {
  const total = useMemo(() => summarize(rows.map((row) => row[COLUMN.yield])), [rows])
  const perHectare = useMemo(
    () => summarize(rows.map((row) => row[COLUMN.yield] / row[COLUMN.hectares])),
    [rows],
  )
  const singlePlot = rows.length === 1
  const fixedSize = rows.length > 1 && new Set(rows.map((row) => row[COLUMN.hectares])).size === 1
  const ratioAvailable = total.cv > 0 && perHectare.cv > 0
  const ratio = ratioAvailable ? total.cv / perHectare.cv : 0
  const ceiling = Math.max(total.cv, perHectare.cv, 1)
  const title =
    rows.length === 0
      ? 'No plots to compare.'
      : singlePlot
        ? 'One plot has no spread to normalise.'
        : fixedSize
          ? 'Fixed plot size leaves the spread unchanged.'
          : 'Normalising by area removes most of the spread.'
  const ratioLabel =
    rows.length === 0
      ? 'No plots in view'
      : singlePlot
        ? 'not defined with one plot'
        : fixedSize
          ? 'identical CV: every plot has the same area'
          : 'smaller CV once area is removed'
  const contrastNote =
    rows.length === 0
      ? 'No plots match the current filters, so there is no spread to compare.'
      : singlePlot
        ? 'With one plot there is no variation, and the size effect cannot be estimated.'
        : fixedSize
          ? 'All filtered plots share the same area, so removing it cannot reduce the spread. The full-sample contrast returns when plot size varies.'
          : 'Most of the apparent total-yield spread comes from plot area. The per-hectare CV is lower, but the full sample still contains a size gradient.'

  return (
    <Panel className="border-transparent bg-forest-950 text-cream-50">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.25fr_0.9fr] lg:items-center lg:gap-8">
        <div>
          <p className="eyebrow text-[0.52rem] text-lime-300/70">Dispersion, decoded</p>
          <h2 className="mt-2 max-w-[18ch] font-display text-2xl font-medium leading-[1.08] tracking-tight md:text-[1.75rem]">
            {title}
          </h2>
        </div>

        <dl className="space-y-4">
          {[
            { label: 'Total yield', summary: total, color: 'bg-clay-500' },
            { label: 'Yield per hectare', summary: perHectare, color: 'bg-lime-300' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[0.68rem] font-semibold text-cream-50/65">
                  {item.label}
                </dt>
                <dd className="font-display text-xl font-medium tabular-nums text-cream-50">
                  {rows.length === 0 ? '—' : `${decimal(item.summary.cv, 1)}%`}
                  <span className="ml-1.5 font-sans text-[0.54rem] font-medium text-cream-50/40">
                    CV
                  </span>
                </dd>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream-50/10">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: rows.length === 0 ? '0%' : `${(item.summary.cv / ceiling) * 100}%` }}
                />
              </div>
              <p className="mt-1.5 text-[0.56rem] tabular-nums text-cream-50/40">
                {rows.length === 0
                  ? 'No plots in view.'
                  : `Range ${int(item.summary.range)} · IQR ${int(item.summary.iqr)} · SD ${int(
                      item.summary.sd,
                    )} kg`}
              </p>
            </div>
          ))}
        </dl>

        <div className="rounded-2xl border border-cream-50/10 bg-cream-50/5 p-4">
          <p className="eyebrow text-[0.46rem] text-cream-50/35">Size effect</p>
          <p className="mt-2 font-display text-5xl font-medium leading-none tracking-tight text-lime-300">
            {rows.length === 0 ? '—' : ratioAvailable ? ratio.toFixed(1) : 'n/a'}
            {ratioAvailable ? <span className="ml-0.5 text-2xl">×</span> : null}
          </p>
          <p className="mt-2 text-[0.62rem] font-medium text-cream-50/55">{ratioLabel}</p>
          <p className="mt-3 border-t border-cream-50/10 pt-3 text-[0.62rem] leading-relaxed text-cream-50/45">
            {contrastNote}
          </p>
        </div>
      </div>
    </Panel>
  )
}
