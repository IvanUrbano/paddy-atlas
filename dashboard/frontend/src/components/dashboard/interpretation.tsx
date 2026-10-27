import { useMemo } from 'react'
import { COLUMN, type Eda } from '../../data/eda'
import { correlation, correlation3, int, pValue, perHa } from '../../lib/format'
import { etaSquared, groupStats, linearFit, mean, pearson, summarize } from '../../lib/stats'
import { Panel } from './primitives'

export function Interpretation({
  eda,
  rows,
  filtered,
}: {
  eda: Eda
  rows: number[][]
  filtered: boolean
}) {
  const facts = useMemo(() => {
    const yields = rows.map((row) => row[COLUMN.yield])
    const hectares = rows.map((row) => row[COLUMN.hectares])
    const perHectare = rows.map((row) => row[COLUMN.yield] / row[COLUMN.hectares])
    const total = summarize(yields)
    const normalized = summarize(perHectare)
    const fit = linearFit(hectares, yields)
    const variety = groupStats(rows, COLUMN.variety, eda.meta.varieties)
    const varietyMeans = variety.map((item) => item.perHa)
    const varietySpread =
      varietyMeans.length > 1 ? Math.max(...varietyMeans) - Math.min(...varietyMeans) : 0
    const sizeValues = new Set(hectares)
    const sizeBuckets = new Map<number, number[]>()
    for (const row of rows) {
      const hectaresValue = row[COLUMN.hectares]
      const bucket = sizeBuckets.get(hectaresValue)
      if (bucket) bucket.push(row[COLUMN.yield] / hectaresValue)
      else sizeBuckets.set(hectaresValue, [row[COLUMN.yield] / hectaresValue])
    }
    const sizeMeans = [...sizeBuckets.entries()]
      .sort(([left], [right]) => left - right)
      .map(([hectaresValue, values]) => ({
        hectares: hectaresValue,
        value: mean(values),
        count: values.length,
      }))

    return {
      count: total.count,
      total,
      normalized,
      r: pearson(hectares, yields),
      rPerHa: pearson(hectares, perHectare),
      sizeEta: etaSquared(perHectare, hectares),
      slope: fit.slope,
      r2: fit.r2,
      varietySpread,
      varieties: variety,
      sizeVaries: sizeValues.size > 1,
      sizeLabel: sizeValues.size === 1 ? `${hectares[0]} ha` : '',
      sizeMeans,
      cvTotal: total.cv,
      cvPerHa: normalized.cv,
      duplicateShare: (eda.meta.duplicates / eda.meta.rowsRaw) * 100,
    }
  }, [eda, rows])

  const scope = filtered ? 'the filtered view' : 'the full clean dataset'
  const centreStory =
    facts.total.mean < facts.total.median
      ? 'the mean sits below the median, pulled down by a tail of low-yield plots'
      : facts.total.mean > facts.total.median
        ? 'the mean sits above the median, lifted by a tail of high-yield plots'
        : 'mean and median coincide'
  const perHaGap = Math.abs(facts.normalized.mean - facts.normalized.median) < 100
  const sizeMeanValues = facts.sizeMeans.map((item) => item.value)
  const sizeMeanMin = sizeMeanValues.length ? Math.min(...sizeMeanValues) : 0
  const sizeMeanMax = sizeMeanValues.length ? Math.max(...sizeMeanValues) : 0
  const topSize = facts.sizeMeans.reduce<(typeof facts.sizeMeans)[number] | null>(
    (best, item) => (!best || item.value > best.value ? item : best),
    null,
  )
  const varietyAnova = eda.analysis.varietyPerHa

  if (rows.length === 0) {
    return (
      <Panel>
        <p className="eyebrow text-[0.52rem] text-forest-900/40">No plots in view</p>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-forest-900/55">
          The active filter combination returns no plots, so there is nothing to interpret. Clear
          one or more filters above to restore the analysis.
        </p>
      </Panel>
    )
  }

  const cards = [
    {
      index: '01',
      kicker: 'Scale effect',
      title: facts.sizeVaries
        ? 'Plot size shifts both total and per-hectare yield.'
        : 'Plot size is fixed in this view.',
      body: facts.sizeVaries
        ? `Across ${int(facts.count)} plots in ${scope}, total yield and hectares correlate at r = ${correlation3(
            facts.r,
          )} (R² = ${facts.r2.toFixed(3)}). The fit adds roughly ${int(
            facts.slope,
          )} kg per additional hectare. Yield per hectare still correlates with size at r = ${correlation(
            facts.rPerHa,
          )}; a one-way comparison across size groups gives η² = ${facts.sizeEta.toFixed(
            3,
          )} in this view. Size-group means range from ${int(sizeMeanMin)} to ${int(
            sizeMeanMax,
          )} kg/ha${topSize ? `, with the highest at ${topSize.hectares} ha` : ''}. Dividing by area removes most dispersion, not the entire size gradient.`
        : `Every plot in ${scope} is ${facts.sizeLabel}, so size is constant and its correlation with either yield measure is undefined. No between-size comparison is possible until the filter is widened.`,
      chips: facts.sizeVaries
        ? [
            `r = ${correlation3(facts.r)}`,
            `R² = ${facts.r2.toFixed(3)}`,
            `per-ha r = ${correlation(facts.rPerHa)}`,
            `size η² = ${facts.sizeEta.toFixed(3)}`,
          ]
        : ['plot size fixed by filter', `n = ${int(facts.count)}`, 'r undefined'],
    },
    {
      index: '02',
      kicker: 'Central tendency',
      title: 'Mean and median differ with the plot-size mix.',
      body: `Total yield has mean ${int(facts.total.mean)} kg and median ${int(
        facts.total.median,
      )} kg; ${centreStory}. After dividing by area, mean (${int(
        facts.normalized.mean,
      )}) and median (${int(facts.normalized.median)}) ${
        perHaGap ? 'are close' : 'still differ'
      }. The per-hectare mean is the more comparable summary across plot sizes.`,
      chips: [
        `total mean ${int(facts.total.mean)} kg`,
        `median ${int(facts.total.median)} kg`,
        `per ha ${int(facts.normalized.mean)} kg`,
      ],
    },
    {
      index: '03',
      kicker: 'Variety',
      title: 'Variety mean differences are small.',
      body:
        facts.varieties.length === 1
          ? `The filters leave only ${facts.varieties[0].name}, at ${perHa(
              facts.varieties[0].perHa,
            )} on average. The full-sample one-way ANOVA on yield per hectare gives p = ${pValue(
              varietyAnova.p,
            )} and η² = ${varietyAnova.etaSquared.toFixed(4)} — about 0.4% of variance. A single-group view cannot test that difference.`
          : `Per-hectare means for the varieties present span ${int(
              facts.varietySpread,
            )} kg/ha in ${scope}. The full-sample one-way ANOVA gives p = ${pValue(
              varietyAnova.p,
            )} and η² = ${varietyAnova.etaSquared.toFixed(
              4,
            )} — about 0.4% of variance. A detectable difference in 2,338 rows can still be small in absolute terms.`,
      chips:
        facts.varieties.length === 1
          ? [
              `${facts.varieties[0].name} · ${perHa(facts.varieties[0].perHa)}`,
              `p = ${pValue(varietyAnova.p)} · full sample`,
              `η² = ${varietyAnova.etaSquared.toFixed(4)} · full sample`,
            ]
          : [
              `${int(facts.varietySpread)} kg/ha spread`,
              `p = ${pValue(varietyAnova.p)} · full sample`,
              `η² = ${varietyAnova.etaSquared.toFixed(4)} · full sample`,
            ],
    },
    {
      index: '04',
      kicker: 'Weather',
      title: 'Rainfall varies seasonally; humidity varies by block.',
      body: 'Early rainfall stays within 18.1–19.6 mm across blocks, rises to about 186 mm in D31–60 and falls to about 60 mm by D91–120. Between-block rainfall ranges are about 1–2 mm within each window. Humidity is less uniform: D1–30 block means span 64.6–88.5%. All 360 readings of 4 knots in D61–90 occur in Panruti.',
      chips: ['18.1–19.6 mm early rain', 'humidity 64.6–88.5%', '360 low-wind rows'],
    },
    {
      index: '05',
      kicker: 'Inputs',
      title: facts.sizeVaries
        ? 'Inputs are exact multiples of plot area.'
        : 'Inputs are constant in this view.',
      body: facts.sizeVaries
        ? 'Seed rate, DAP, micronutrients and pest control are exact multiples of hectares, so their correlation with yield is r = 1.000 by construction. Urea and potash follow the same template. The matrix is showing scale, not an agronomic response.'
        : 'Plot size is fixed by the filter, so seed rate, DAP, micronutrients and pest control are constant; their correlation with yield is undefined in this view. Across the full sample they are exact multiples of hectares.',
      chips: facts.sizeVaries
        ? ['r = 1.000', '7 engineered features', 'collinearity, not cause']
        : ['plot size fixed by filter', 'r undefined', 'full-sample construction'],
    },
    {
      index: '06',
      kicker: 'Model',
      title: 'Per-hectare modelling still needs a size term.',
      body: `A model of total yield would largely recover plot area. A per-hectare target removes most of that scaling, but size still accounts for η² = ${facts.sizeEta.toFixed(
        2,
      )} of per-hectare variance in ${scope}, and per-hectare CV is ${facts.cvPerHa.toFixed(
        1,
      )}%. A planned model should include size or block structure and use group-aware validation. No model is fitted in this release.`,
      chips: ['target kg/ha', 'size term', 'block-grouped CV'],
    },
  ]

  const caveats = [
    'This is observational data. Nothing here identifies a causal effect of variety, soil, nursery or inputs.',
    `Duplicates account for ${facts.duplicateShare.toFixed(
      1,
    )}% of raw rows. They were dropped as repeated records; if any were genuine field replicates, the effective sample size is smaller.`,
    'Several inputs are exact multiples of plot area, and rainfall and irrigation are constant within each block-window. Their associations with yield are not identified in a naive model.',
    'Weather has limited between-plot variation within a block-window. Seasonal averages describe the crop calendar rather than plot-level exposure.',
    'Unless stated otherwise, the dashboard reports descriptive statistics only. ANOVA p-values, effect sizes and the weather audit are full-sample results and do not change with the filters.',
  ]

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.index}
            className="flex flex-col rounded-[1.5rem] border border-forest-900/10 bg-cream-50 p-5 md:p-6"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-display text-sm font-semibold tabular-nums text-leaf-600">
                {card.index}
              </span>
              <p className="eyebrow text-[0.52rem] text-forest-900/40">{card.kicker}</p>
            </div>
            <h3 className="mt-3 font-display text-xl font-medium leading-tight tracking-tight text-forest-950">
              {card.title}
            </h3>
            <p className="mt-3 flex-1 text-[0.76rem] leading-relaxed text-forest-900/60">{card.body}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {card.chips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full bg-cream-200/70 px-2.5 py-1 text-[0.58rem] font-semibold tabular-nums text-forest-900/60"
                >
                  {chip}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-7">
          <p className="eyebrow text-[0.52rem] text-clay-600">Read with care</p>
          <h3 className="mt-2 font-display text-xl font-medium tracking-tight text-forest-950">
            Caveats that survive the dashboard.
          </h3>
          <ul className="mt-4 space-y-3">
            {caveats.map((caveat) => (
              <li key={caveat} className="flex gap-3 text-[0.72rem] leading-relaxed text-forest-900/60">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-clay-500" />
                {caveat}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="flex flex-col justify-between border-transparent bg-forest-950 text-cream-50 lg:col-span-5">
          <div>
            <p className="eyebrow text-[0.52rem] text-lime-300/70">Summary</p>
            <h3 className="mt-3 font-display text-xl font-medium tracking-tight text-cream-50">
              What the view supports
            </h3>
            <ul className="mt-4 space-y-3 text-[0.74rem] leading-relaxed text-cream-50/60">
              <li>
                Plot size accounts for most total-yield variation (R² = {facts.r2.toFixed(3)} in {scope}).
              </li>
              <li>
                Yield per hectare is less dispersed (CV {facts.cvPerHa.toFixed(
                  1,
                )}%), but it still carries a size gradient (η² = {facts.sizeEta.toFixed(3)} in{' '}
                {scope}).
              </li>
              <li>
                Variety means span {int(facts.varietySpread)} kg/ha; the full-sample η² is{' '}
                {varietyAnova.etaSquared.toFixed(4)}.
              </li>
              <li>Weather correlations with yield are near zero; rainfall differences are mainly seasonal.</li>
            </ul>
          </div>
          <div className="mt-6 border-t border-cream-50/10 pt-4">
            <p className="text-[0.72rem] leading-relaxed text-cream-50/55">
              Not supported by this release: causal effects, out-of-sample prediction, or a claim
              that per-hectare yield is uniform across plot sizes.
            </p>
            <p className="mt-3 text-[0.62rem] tabular-nums text-cream-50/35">
              Total CV {facts.cvTotal.toFixed(1)}% · Per-hectare CV {facts.cvPerHa.toFixed(1)}% ·
              Mean {perHa(facts.normalized.mean)}
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
