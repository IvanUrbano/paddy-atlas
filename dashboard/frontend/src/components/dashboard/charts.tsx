import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { COLUMN, type WeatherWindow } from '../../data/eda'
import { correlation, correlation3, int, perHa } from '../../lib/format'
import { etaSquared, groupStats, histogram, linearFit, mean, median, pearson } from '../../lib/stats'
import { Panel, PanelHead, Segmented } from './primitives'

const colors = {
  forest: '#155c3e',
  leaf: '#4a9f66',
  leafSoft: '#74bd88',
  lime: '#cfe98b',
  clay: '#8a5a3b',
  sand: '#dbcdb0',
  ink: '#10452f',
  grid: 'rgba(11, 51, 35, 0.12)',
}

const tooltipStyle = {
  backgroundColor: '#fdfbf4',
  border: '1px solid #dbcdb0',
  borderRadius: 12,
  boxShadow: '0 16px 40px rgba(4, 22, 15, 0.14)',
  fontSize: 12,
  color: '#04160f',
  padding: '8px 12px',
}

const axis = {
  tick: { fill: '#10452f', fontSize: 10 },
  tickLine: false,
  axisLine: { stroke: 'rgba(11, 51, 35, 0.18)' },
} as const

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.64rem] font-medium text-forest-900/60">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

export function YieldDistribution({ rows }: { rows: number[][] }) {
  const [metric, setMetric] = useState<'total' | 'perHa'>('total')
  const values = useMemo(
    () => rows.map((row) => (metric === 'total' ? row[COLUMN.yield] : row[COLUMN.yield] / row[COLUMN.hectares])),
    [rows, metric],
  )
  const bins = useMemo(() => histogram(values, 26, metric === 'total' ? 0 : 2), [values, metric])
  const middle = median(values)

  const medianBin = bins.reduce(
    (closest, bin) =>
      Math.abs((bin.from + bin.to) / 2 - middle) < Math.abs((closest.from + closest.to) / 2 - middle)
        ? bin
        : closest,
    bins[0],
  )

  return (
    <Panel>
      <PanelHead
        kicker="Distribution"
        title="How harvests are shaped"
        note={
          rows.length > 0
            ? `Median ${metric === 'total' ? `${int(middle)} kg` : perHa(middle)}. ${
                metric === 'total'
                  ? 'Bars combine six plot sizes, so the total-yield distribution reflects that mixture. Switch measures to remove most, not all, of the size effect.'
                  : 'Per-hectare values remove most, not all, of the size effect.'
              }`
            : 'No plots match the current filters.'
        }
        action={
          <Segmented
            label="Distribution measure"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'total', label: 'Total yield' },
              { value: 'perHa', label: 'Per hectare' },
            ]}
          />
        }
      />
      {rows.length > 0 ? (
        <div
          role="img"
          aria-label={`Histogram of ${metric === 'total' ? 'paddy yield' : 'paddy yield per hectare'} across ${rows.length} plots`}
        >
          <ResponsiveContainer width="100%" height={252}>
            <BarChart data={bins} margin={{ top: 10, right: 8, left: -20, bottom: 0 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke={colors.grid} />
              <XAxis dataKey="label" interval={metric === 'total' ? 4 : 5} {...axis} />
              <YAxis {...axis} width={44} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: colors.ink, fontWeight: 600 }}
                formatter={(value) => [`${int(Number(value))} plots`, 'Count']}
                labelFormatter={(label) =>
                  `Yield ${label} kg${metric === 'perHa' ? '/ha' : ''}`
                }
              />
              <Bar dataKey="count" fill={colors.leaf} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              {medianBin ? (
                <ReferenceLine
                  x={medianBin.label}
                  stroke={colors.clay}
                  strokeDasharray="4 4"
                  strokeWidth={1.2}
                />
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart />
      )}
      <p className="mt-3 text-[0.66rem] text-forest-900/45">
        Dashed line marks the median. X axis groups values in thousands of kilograms
        {metric === 'perHa' ? ' per hectare' : ''}.
      </p>
    </Panel>
  )
}

export function ScaleScatter({
  rows,
  varieties,
}: {
  rows: number[][]
  varieties: string[]
}) {
  const [metric, setMetric] = useState<'total' | 'perHa'>('total')

  const series = useMemo(() => {
    const palette = [colors.forest, colors.leaf, colors.clay]
    return varieties.map((variety, index) => ({
      variety,
      color: palette[index % palette.length],
      points: rows
        .filter((row) => row[COLUMN.variety] === index)
        .map((row) => ({
          hectares: row[COLUMN.hectares],
          value:
            metric === 'total'
              ? row[COLUMN.yield]
              : row[COLUMN.yield] / row[COLUMN.hectares],
        })),
    }))
  }, [rows, varieties, metric])

  const xs = rows.map((row) => row[COLUMN.hectares])
  const ys = rows.map((row) =>
    metric === 'total' ? row[COLUMN.yield] : row[COLUMN.yield] / row[COLUMN.hectares],
  )
  const r = pearson(xs, ys)
  const fit = linearFit(xs, ys)
  const eta = etaSquared(ys, xs)
  const sizeVaries = new Set(xs).size > 1
  const empty = rows.length === 0

  const groupMeans = useMemo(() => {
    const buckets = new Map<number, number[]>()
    for (const row of rows) {
      const hectares = row[COLUMN.hectares]
      const value =
        metric === 'total' ? row[COLUMN.yield] : row[COLUMN.yield] / row[COLUMN.hectares]
      const bucket = buckets.get(hectares)
      if (bucket) bucket.push(value)
      else buckets.set(hectares, [value])
    }
    return [...buckets.entries()]
      .sort(([left], [right]) => left - right)
      .map(([hectares, values]) => ({
        hectares,
        value: mean(values),
        count: values.length,
      }))
  }, [rows, metric])

  const top = groupMeans.reduce<(typeof groupMeans)[number] | null>(
    (best, item) => (!best || item.value > best.value ? item : best),
    null,
  )

  const title = empty
    ? 'No plots to show'
    : !sizeVaries
      ? 'Plot size is fixed in this view'
      : metric === 'total'
        ? 'Total yield rises with plot size'
        : 'Yield per hectare by plot size'

  const note = empty
    ? 'No plots match the current filters.'
    : !sizeVaries
      ? 'Every plot has the same area, so no between-size comparison is possible in this view.'
      : metric === 'total'
        ? 'Each point is one plot. The dashed line is a least-squares fit; its slope is kilograms per additional hectare.'
        : 'Area is divided out. Points are plots; the dashed line joins the mean at each plot size. A size gradient remains.'

  return (
    <Panel>
      <PanelHead
        kicker="Scale effect"
        title={title}
        note={note}
        action={
          <Segmented
            label="Scale measure"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'total', label: 'Total yield' },
              { value: 'perHa', label: 'Per hectare' },
            ]}
          />
        }
      />
      {empty ? null : (
        <div className="mb-2 flex flex-wrap items-center gap-3">
          {series.map((item) => (
            <LegendChip key={item.variety} color={item.color} label={item.variety} />
          ))}
          {metric === 'perHa' && groupMeans.length > 1 ? (
            <LegendChip color={colors.clay} label="Size-group mean" />
          ) : null}
          <span className="ml-auto rounded-full bg-cream-200/70 px-2.5 py-0.5 text-[0.62rem] font-semibold tabular-nums text-forest-900/70">
            {sizeVaries
              ? metric === 'total'
                ? `r = ${correlation3(r)} · R² = ${fit.r2.toFixed(3)}`
                : `r = ${correlation3(r)} · η² = ${correlation(eta)}`
              : 'r = n/a'}
          </span>
        </div>
      )}
      {rows.length > 0 ? (
        <div
          role="img"
          aria-label={`Scatter plot of plot size against ${
            metric === 'total' ? 'total yield' : 'yield per hectare'
          }, correlation ${sizeVaries ? correlation3(r) : 'not defined'}`}
        >
          <ResponsiveContainer width="100%" height={236}>
            <ScatterChart margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
              <CartesianGrid stroke={colors.grid} />
              <XAxis
                type="number"
                dataKey="hectares"
                name="Hectares"
                domain={[0.8, 6.2]}
                ticks={[1, 2, 3, 4, 5, 6]}
                {...axis}
              />
              <YAxis
                type="number"
                dataKey="value"
                name={metric === 'total' ? 'Yield' : 'Yield per ha'}
                width={52}
                tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                {...axis}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ strokeDasharray: '3 3', stroke: colors.ink }}
                labelFormatter={(label) => `${label} ha`}
                formatter={(value, name) => [
                  metric === 'total' ? `${int(Number(value))} kg` : perHa(Number(value)),
                  name,
                ]}
              />
              {series.map((item) => (
                <Scatter
                  key={item.variety}
                  name={item.variety}
                  data={item.points}
                  fill={item.color}
                  fillOpacity={0.35}
                  isAnimationActive={false}
                />
              ))}
              {metric === 'perHa' && groupMeans.length > 1 ? (
                <Scatter
                  name="Size-group mean"
                  data={groupMeans}
                  fill={colors.clay}
                  shape="diamond"
                  line={{ stroke: colors.clay, strokeWidth: 2, strokeDasharray: '5 4' }}
                  isAnimationActive={false}
                />
              ) : null}
              {metric === 'total' && sizeVaries ? (
                <ReferenceLine
                  segment={[
                    { x: 1, y: fit.intercept + fit.slope },
                    { x: 6, y: fit.intercept + fit.slope * 6 },
                  ]}
                  stroke={colors.ink}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              ) : null}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart />
      )}
      {!empty && sizeVaries && metric === 'perHa' && top ? (
        <p className="mt-3 text-[0.66rem] text-forest-900/45">
          Highest size-group mean: {perHa(top.value)} at {top.hectares} ha (n = {int(top.count)}).
        </p>
      ) : null}
    </Panel>
  )
}

type CategoryDim = 'variety' | 'soil' | 'block'

const dimMeta: Record<
  CategoryDim,
  { index: number; kicker: string; title: string }
> = {
  variety: {
    index: COLUMN.variety,
    kicker: 'Variety',
    title: 'Yield by rice variety',
  },
  soil: {
    index: COLUMN.soil,
    kicker: 'Soil',
    title: 'Yield by soil type',
  },
  block: {
    index: COLUMN.block,
    kicker: 'Geography',
    title: 'Yield by agriblock',
  },
}

export function CategoryPanel({
  dim,
  rows,
  labels,
}: {
  dim: CategoryDim
  rows: number[][]
  labels: string[]
}) {
  const [metric, setMetric] = useState<'perHa' | 'total'>('perHa')
  const meta = dimMeta[dim]

  const data = useMemo(
    () =>
      groupStats(rows, meta.index, labels).map((stat) => ({
        name: stat.name,
        value: metric === 'perHa' ? stat.perHa : stat.meanYield,
        count: stat.count,
      })),
    [rows, labels, meta.index, metric],
  )

  const overall = useMemo(
    () =>
      mean(
        rows.map((row) =>
          metric === 'perHa' ? row[COLUMN.yield] / row[COLUMN.hectares] : row[COLUMN.yield],
        ),
      ),
    [rows, metric],
  )

  const values = data.map((item) => item.value)
  const note =
    data.length === 0
      ? 'No plots match the current filters.'
      : data.length === 1
        ? 'Only one group is present in the current view.'
        : metric === 'perHa'
          ? `Group means span ${int(Math.min(...values))}–${int(Math.max(...values))} kg/ha; overall mean ${int(overall)} kg/ha.`
          : 'Group means mix yield intensity with plot-size composition. Use per hectare to compare groups of different sizes.'

  const height = Math.max(150, data.length * 46 + 20)

  return (
    <Panel className="h-full">
      <PanelHead
        kicker={meta.kicker}
        title={meta.title}
        note={note}
        action={
          <Segmented
            label="Yield measure"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'perHa', label: 'Per hectare' },
              { value: 'total', label: 'Total' },
            ]}
          />
        }
      />
      {data.length > 0 ? (
        <div role="img" aria-label={`${meta.title}, ${metric === 'perHa' ? 'per hectare' : 'total'} means`}>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }}>
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              <YAxis
                type="category"
                dataKey="name"
                width={88}
                tick={{ fill: colors.ink, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(207, 233, 139, 0.18)' }}
                formatter={(value, _name, item) => [
                  metric === 'perHa' ? perHa(Number(value)) : `${int(Number(value))} kg`,
                  `${metric === 'perHa' ? 'Mean per ha' : 'Mean yield'} (n = ${int(
                    Number(item?.payload?.count ?? 0),
                  )})`,
                ]}
              />
              <ReferenceLine
                x={overall}
                stroke={colors.clay}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Bar
                dataKey="value"
                fill={metric === 'perHa' ? colors.leaf : colors.forest}
                radius={[0, 6, 6, 0]}
                barSize={14}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(value) =>
                    metric === 'perHa' ? int(Number(value)) : `${Math.round(Number(value) / 1000)}k`
                  }
                  style={{ fill: colors.ink, fontSize: 10, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart />
      )}
      {data.length > 0 ? (
        <p className="mt-2 text-[0.66rem] text-forest-900/45">
          Dashed line marks the overall mean. Bars show group means; n is available in the tooltip.
        </p>
      ) : null}
    </Panel>
  )
}

export function WaterPanel({
  windows,
  block,
}: {
  windows: WeatherWindow[]
  block: string
}) {
  return (
    <Panel>
      <PanelHead
        kicker="Water"
        title="Rain and irrigation by window"
        note={`Millimetres received across four growth windows${
          block !== 'all' ? ` in ${block}` : ", weighted by the plots in view"
        }.`}
      />
      {windows.length > 0 ? (
        <>
          <div className="mb-3 flex flex-wrap gap-3">
            <LegendChip color={colors.leafSoft} label="Rainfall" />
            <LegendChip color={colors.forest} label="Irrigation" />
          </div>
          <div
            role="img"
            aria-label={`Rainfall and irrigation by growth window${
              block !== 'all' ? ` in ${block}` : ' weighted by the filtered plots'
            }`}
          >
            <ResponsiveContainer width="100%" height={232}>
              <BarChart data={windows} margin={{ top: 6, right: 8, left: -18, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke={colors.grid} />
                <XAxis dataKey="label" {...axis} />
                <YAxis width={46} {...axis} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(207, 233, 139, 0.14)' }}
                  formatter={(value, name) => [`${Number(value).toFixed(1)} mm`, name]}
                />
                <Bar dataKey="rain" name="Rainfall" fill={colors.leafSoft} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="irrigation" name="Irrigation" fill={colors.forest} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-[0.66rem] text-forest-900/45">
            D1–30 receives under 20 mm of rain; irrigation peaks at D31–60.
          </p>
        </>
      ) : (
        <EmptyChart />
      )}
    </Panel>
  )
}

export function ClimatePanel({ windows }: { windows: WeatherWindow[] }) {
  return (
    <Panel>
      <PanelHead
        kicker="Climate"
        title="Temperature and humidity"
        note="Minimum and maximum temperature with relative humidity across the season."
      />
      {windows.length > 0 ? (
        <>
          <div className="mb-3 flex flex-wrap gap-3">
            <LegendChip color={colors.clay} label="Max temp" />
            <LegendChip color={colors.leaf} label="Min temp" />
            <LegendChip color={colors.forest} label="Humidity" />
          </div>
          <div role="img" aria-label="Minimum and maximum temperature with humidity by growth window">
            <ResponsiveContainer width="100%" height={232}>
              <ComposedChart data={windows} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={colors.grid} />
                <XAxis dataKey="label" {...axis} />
                <YAxis yAxisId="temp" domain={[10, 40]} width={40} {...axis} />
                <YAxis
                  yAxisId="humidity"
                  orientation="right"
                  domain={[60, 100]}
                  width={40}
                  {...axis}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    name === 'Humidity' ? `${Number(value).toFixed(1)} %` : `${Number(value).toFixed(1)} °C`,
                    name,
                  ]}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="maxTemp"
                  name="Max temp"
                  stroke={colors.clay}
                  strokeWidth={2}
                  dot={{ r: 3, fill: colors.clay }}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="minTemp"
                  name="Min temp"
                  stroke={colors.leaf}
                  strokeWidth={2}
                  dot={{ r: 3, fill: colors.leaf }}
                />
                <Line
                  yAxisId="humidity"
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity"
                  stroke={colors.forest}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={{ r: 2.5, fill: colors.forest }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-[0.66rem] text-forest-900/45">
            Humidity stays above 80% once the canopy closes; the temperature swing widens late.
          </p>
        </>
      ) : (
        <EmptyChart />
      )}
    </Panel>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-forest-900/15 text-xs text-forest-900/45">
      No plots match these filters.
    </div>
  )
}
