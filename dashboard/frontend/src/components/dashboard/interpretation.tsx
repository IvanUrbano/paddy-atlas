import { useMemo } from 'react'
import { COLUMN, type Eda } from '../../data/eda'
import { correlation, int, perHa } from '../../lib/format'
import { groupStats, linearFit, pearson, summarize } from '../../lib/stats'
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

    return {
      count: total.count,
      total,
      normalized,
      r: pearson(hectares, yields),
      slope: fit.slope,
      r2: fit.r2,
      varietySpread,
      varieties: variety,
      sizeVaries: sizeValues.size > 1,
      sizeLabel: sizeValues.size === 1 ? `${hectares[0]} ha` : '',
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
      kicker: 'The scale effect',
      title: facts.sizeVaries
        ? 'Plot size does most of the talking.'
        : 'The scale effect is switched off.',
      body: facts.sizeVaries
        ? `Across ${int(facts.count)} plots in ${scope}, size and total yield correlate at r = ${correlation(
            facts.r,
          )}. The least-squares line adds roughly ${int(facts.slope)} kg for every extra hectare and explains ${(
            facts.r2 * 100
          ).toFixed(1)}% of the variance. That is mostly arithmetic: a bigger field holds more rice.`
        : `Every plot in ${scope} is ${facts.sizeLabel}, so size is constant and its correlation with total yield is undefined. The arithmetic scale effect only reappears once the plot-size filter is cleared or widened.`,
      chips: facts.sizeVaries
        ? [`r = ${correlation(facts.r)}`, `R² = ${facts.r2.toFixed(2)}`, `+${int(facts.slope)} kg / extra ha`]
        : ['plot size fixed by filter', `n = ${int(facts.count)}`, 'r undefined'],
    },
    {
      index: '02',
      kicker: 'Central tendency',
      title: 'Two centres tell two different stories.',
      body: `Total yield centres at ${int(facts.total.mean)} kg (mean) and ${int(
        facts.total.median,
      )} kg (median); ${centreStory}. Once area is removed, mean (${int(
        facts.normalized.mean,
      )}) and median (${int(facts.normalized.median)}) ${
        perHaGap ? 'almost coincide' : 'still differ'
      }.`,
      chips: [
        `total mean ${int(facts.total.mean)} kg`,
        `median ${int(facts.total.median)} kg`,
        `per ha ${int(facts.normalized.mean)} kg`,
      ],
    },
    {
      index: '03',
      kicker: 'Dispersion',
      title:
        facts.varieties.length === 1
          ? 'Only one variety is in view.'
          : 'Differences are detectable, not meaningful.',
      body:
        facts.varieties.length === 1
          ? `The filters leave only ${facts.varieties[0].name}, at ${perHa(
              facts.varieties[0].perHa,
            )} on average. The full-sample one-way ANOVA on yield per hectare flags variety at p = 0.007 with an effect size of η² = 0.0043 — about 0.4% of variance. A single-group view cannot test that difference.`
          : `Per-hectare averages for the varieties present span only ${int(
              facts.varietySpread,
            )} kg/ha in ${scope}. The full-sample one-way ANOVA on yield per hectare flags variety at p = 0.007, but the effect size is η² = 0.0043 — about 0.4% of variance. Detectable in 2,338 rows is not the same as meaningful in a field.`,
      chips:
        facts.varieties.length === 1
          ? [
              `${facts.varieties[0].name} · ${perHa(facts.varieties[0].perHa)}`,
              'p = 0.007 · full sample',
              'η² = 0.0043 · full sample',
            ]
          : [
              `${int(facts.varietySpread)} kg/ha spread`,
              'p = 0.007 · full sample',
              'η² = 0.0043 · full sample',
            ],
    },
    {
      index: '04',
      kicker: 'Weather',
      title: 'Weather changes with the season, not the block.',
      body: 'Early rainfall stays within 18.1–19.6 mm across blocks, then rises to about 186 mm in D31–60 before falling to about 60 mm by D91–120. The large movements are seasonal; between-block differences within each window stay small. The 360 rows at 4 knots of wind are all Panruti in D61–90 — a regional recording pattern, not a yield signal.',
      chips: ['18.1–19.6 mm early rain', '360 low-wind rows', 'full-sample weather'],
    },
    {
      index: '05',
      kicker: 'Inputs',
      title: facts.sizeVaries ? 'Inputs are a copy of plot size.' : 'Inputs are constant in this view.',
      body: facts.sizeVaries
        ? 'Seed rate, DAP, micronutrients and pest control are exact multiples of hectares, so their correlation with yield is r = 1.000 by construction. Urea and potash follow the same template. The heatmap is showing scale, not agronomic response.'
        : 'Plot size is fixed by the filter, so seed rate, DAP, micronutrients and pest control are constant too; their correlation with yield is undefined in this view. Across the full sample they are exact multiples of hectares, so the heatmap still describes scale, not agronomic response.',
      chips: facts.sizeVaries
        ? ['r = 1.000', '7 engineered features', 'collinearity, not cause']
        : ['plot size fixed by filter', 'r undefined', 'full-sample construction'],
    },
    {
      index: '06',
      kicker: 'Model',
      title: 'Predict per hectare, offset the area.',
      body: `Almost all of the total-yield story is already told by area, so a credible model uses log yield per hectare as the target and log hectares as an offset. Grouped cross-validation by agriblock is essential, and weather can be dropped or heavily regularised. Expect a low ceiling: per-hectare CV is only ${facts.cvPerHa.toFixed(
        1,
      )}% in ${scope}.`,
      chips: ['target kg/ha', 'log-area offset', 'block-grouped CV'],
    },
  ]

  const caveats = [
    'This is observational data. Nothing here identifies a causal effect of variety, soil, nursery or inputs.',
    `Duplicates account for ${facts.duplicateShare.toFixed(
      1,
    )}% of raw rows. They were dropped as repeated records; if any were genuine field replicates, the effective sample size is smaller.`,
    'Inputs and weather are nearly constant or mechanically tied to area, so their coefficients are not identified in a naive model.',
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
            <p className="eyebrow text-[0.52rem] text-lime-300/70">One-sentence takeaway</p>
            <blockquote className="mt-4 font-display text-[clamp(1.35rem,2.4vw,1.85rem)] font-medium leading-[1.18] tracking-[-0.02em]">
              “The dataset is better at describing how big a plot is than at explaining how well it
              yields.”
            </blockquote>
          </div>
          <div className="mt-6 border-t border-cream-50/10 pt-4">
            <p className="text-[0.72rem] leading-relaxed text-cream-50/55">
              Report per-hectare figures in the deck, keep total-yield charts as a scale check, and
              treat variety, soil and nursery differences as second-order until a properly
              controlled model says otherwise.
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
