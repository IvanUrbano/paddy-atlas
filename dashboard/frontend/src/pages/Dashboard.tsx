import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CategoryPanel,
  ClimatePanel,
  ScaleScatter,
  WaterPanel,
  YieldDistribution,
} from '../components/dashboard/charts'
import { CorrelationGrid, QualityPanel, SummaryTable } from '../components/dashboard/insights'
import { Interpretation } from '../components/dashboard/interpretation'
import {
  CentralTendencyPanel,
  DispersionBox,
  DispersionContrast,
  DispersionPanel,
  FrequencyPanel,
  ShapePanel,
} from '../components/dashboard/measures'
import { FilterBar, Kpi, Panel } from '../components/dashboard/primitives'
import { DashboardNav, SectionHeading } from '../components/dashboard/sections'
import { Logo } from '../components/layout/Logo'
import {
  COLUMN,
  EMPTY_FILTERS,
  useEda,
  type Eda,
  type Filters,
  type WeatherWindow,
} from '../data/eda'
import { correlation, correlation3, int, perHa } from '../lib/format'
import { etaSquared, mean, median, pearson } from '../lib/stats'

export function Dashboard() {
  const { data, error, loading } = useEda()

  return (
    <div className="min-h-screen bg-cream-100 text-forest-950">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cream-50 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-forest-950"
      >
        Skip to dashboard
      </a>

      <DashboardHeader doi={data?.meta.doi} />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {data ? <DashboardBody eda={data} /> : null}

      <DashboardFooter />
    </div>
  )
}

function DashboardHeader({ doi }: { doi?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-forest-900/10 bg-cream-100/85 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link to="/" className="text-forest-950" aria-label="Paddy Atlas overview">
          <Logo />
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <span className="eyebrow hidden text-[0.55rem] text-forest-900/40 sm:inline">
            EDA dashboard
          </span>
          {doi ? (
            <a
              href={doi}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full border border-forest-900/15 px-3.5 py-2 text-[0.68rem] font-semibold text-forest-900/65 transition-colors hover:border-forest-900/35 hover:text-forest-950 md:inline-flex"
            >
              Dataset DOI
            </a>
          ) : null}
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-4 py-2 text-[0.7rem] font-semibold text-cream-50 transition-colors hover:bg-forest-800"
          >
            Overview
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
              <path
                d="M2.5 6h7M6 2.5 9.5 6 6 9.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  )
}

function weightedWeather(rows: number[][], eda: Eda): WeatherWindow[] {
  if (rows.length === 0) return []

  const counts = new Array(eda.meta.blocks.length).fill(0) as number[]
  rows.forEach((row) => {
    counts[row[COLUMN.block]] += 1
  })

  return eda.weather.overall.map((baseline, index) => {
    let weight = 0
    let rain = 0
    let irrigation = 0
    let minTemp = 0
    let maxTemp = 0
    let humidity = 0
    let wind = 0

    eda.meta.blocks.forEach((block, blockIndex) => {
      const blockWeight = counts[blockIndex]
      const window = eda.weather.byBlock[block]?.[index]
      if (blockWeight === 0 || !window) return
      weight += blockWeight
      rain += window.rain * blockWeight
      irrigation += window.irrigation * blockWeight
      minTemp += window.minTemp * blockWeight
      maxTemp += window.maxTemp * blockWeight
      humidity += window.humidity * blockWeight
      wind += window.wind * blockWeight
    })

    if (weight === 0) return baseline
    return {
      ...baseline,
      rain: rain / weight,
      irrigation: irrigation / weight,
      minTemp: minTemp / weight,
      maxTemp: maxTemp / weight,
      humidity: humidity / weight,
      wind: wind / weight,
    }
  })
}

function DashboardBody({ eda }: { eda: Eda }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const rows = useMemo(
    () =>
      eda.rows.filter((row) => {
        if (filters.variety !== 'all' && eda.meta.varieties[row[COLUMN.variety]] !== filters.variety) {
          return false
        }
        if (filters.soil !== 'all' && eda.meta.soils[row[COLUMN.soil]] !== filters.soil) return false
        if (filters.block !== 'all' && eda.meta.blocks[row[COLUMN.block]] !== filters.block) return false
        if (filters.nursery !== 'all' && eda.meta.nurseries[row[COLUMN.nursery]] !== filters.nursery) {
          return false
        }
        if (filters.size !== 'all' && String(row[COLUMN.hectares]) !== filters.size) return false
        return true
      }),
    [eda, filters],
  )

  const summary = useMemo(() => {
    const yields = rows.map((row) => row[COLUMN.yield])
    const hectares = rows.map((row) => row[COLUMN.hectares])
    const perHectare = rows.map((row) => row[COLUMN.yield] / row[COLUMN.hectares])
    return {
      count: rows.length,
      hasPlots: rows.length > 0,
      median: median(yields),
      perHa: mean(perHectare),
      r: pearson(hectares, yields),
      rPerHa: pearson(hectares, perHectare),
      sizeEta: etaSquared(perHectare, hectares),
      sizeVaries: new Set(hectares).size > 1,
    }
  }, [rows])

  const windows = useMemo(() => weightedWeather(rows, eda), [rows, eda])
  const filtered = Object.values(filters).some((value) => value !== 'all')

  const update = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <>
      <title>Paddy Atlas · Yield dashboard</title>
      <section className="relative isolate overflow-hidden bg-forest-950 text-cream-50">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_85%_0%,rgba(207,233,139,0.14),transparent_60%)]"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-16 -z-10 h-64 w-64 rounded-full bg-leaf-500/10 blur-3xl"
        />

        <div className="shell pb-10 pt-12 md:pb-12 md:pt-16">
          <p className="eyebrow text-lime-300/75">
            Descriptive analytics · Exploratory data analysis
          </p>
          <h1 className="mt-5 max-w-[20ch] font-display text-[clamp(2.5rem,5.6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.04em]">
            Paddy yield: patterns and <span className="text-lime-300">limits</span>.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-cream-50/60 md:text-base">
            Every measure below is computed from the cleaned 2,338-plot frame. Use the section bar to
            move from central tendency to dispersion, relationships and interpretation, filtering by
            variety, soil, block, nursery or plot size.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2 text-[0.66rem] font-semibold text-cream-50/70">
            {[
              `${int(eda.meta.rowsClean)} plots`,
              `${eda.meta.blocks.length} agriblocks`,
              `${eda.meta.varieties.length} varieties`,
              `${eda.meta.columns + eda.meta.engineered} cleaned fields`,
              `${eda.meta.duplicates} duplicates removed`,
            ].map((item) => (
              <li key={item} className="rounded-full border border-cream-50/15 px-3 py-1.5">
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.68rem] text-cream-50/45">
            <span>
              Source: {eda.meta.source} · {eda.meta.license}
            </span>
            <a
              href={eda.meta.doi}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-cream-50/25 underline-offset-4 transition-colors hover:text-lime-300"
            >
              DOI 10.24432/C55W3J
            </a>
          </div>
        </div>
      </section>

      <DashboardNav />

      <main id="dashboard-main" className="shell pb-16">
        <section id="overview" className="scroll-mt-36 pt-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Plots in view"
              value={int(summary.count)}
              note={
                summary.count === 0
                  ? '0% of all clean records.'
                  : summary.count < eda.meta.rowsClean * 0.01
                    ? '<1% of all clean records.'
                    : `${((summary.count / eda.meta.rowsClean) * 100).toFixed(0)}% of all clean records.`
              }
            />
            <Kpi
              label="Median yield"
              value={summary.hasPlots ? `${int(summary.median)} kg` : '—'}
              note={
                !summary.hasPlots
                  ? 'No plots match the current filters.'
                  : summary.count === 1
                    ? 'This is the only plot in view.'
                    : 'Half of the filtered plots harvest above this line.'
              }
            />
            <Kpi
              label="Mean yield per hectare"
              value={summary.hasPlots ? perHa(summary.perHa) : '—'}
              note={
                !summary.hasPlots
                  ? 'No plots match the current filters.'
                  : summary.count === 1
                    ? 'This is the only plot in view.'
                    : !summary.sizeVaries
                      ? 'Plot size is fixed here, so per-hectare and total yield differ only by the common area.'
                      : 'Dividing by area reduces spread; it does not remove the size effect.'
              }
            />
            <Kpi
              label="Plot size ↔ total yield"
              value={
                !summary.hasPlots
                  ? '—'
                  : summary.sizeVaries
                    ? `r = ${correlation3(summary.r)}`
                    : 'r = n/a'
              }
              note={
                !summary.hasPlots
                  ? 'No plots match the current filters.'
                  : summary.sizeVaries
                    ? `Per-ha yield still correlates at r = ${correlation(
                        summary.rPerHa,
                      )} (η² = ${summary.sizeEta.toFixed(2)}).`
                    : 'Plot size is fixed by the filter, so the correlation is undefined.'
              }
            />
          </div>

          <div className="mt-5">
            <FilterBar
              eda={eda}
              filters={filters}
              count={summary.count}
              onChange={update}
              onReset={() => setFilters(EMPTY_FILTERS)}
            />
          </div>

          <p className="mt-3 text-[0.66rem] leading-relaxed text-forest-900/45">
            Filters apply to every analysis panel and to the interpretation. Weather is weighted
            by the filtered plots&apos; agriblocks; ANOVA p-values, effect sizes and the
            data-quality audit remain full-sample.{' '}
            <a
              href="#interpretation"
              className="font-semibold text-leaf-600 underline decoration-leaf-600/30 underline-offset-4 transition-colors hover:text-forest-950"
            >
              Jump to interpretation
            </a>
          </p>
        </section>

        <section id="central-tendency" className="scroll-mt-36 pt-14">
          <SectionHeading
            index="01"
            kicker="Central tendency"
            title="Where the harvest centres"
            description="Means, medians, quartiles and the most common categories. The gap between mean and median is the first clue about skew."
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <CentralTendencyPanel rows={rows} />
            </div>
            <div className="lg:col-span-5">
              <FrequencyPanel rows={rows} eda={eda} />
            </div>

            <div className="lg:col-span-4">
              <CategoryPanel dim="variety" rows={rows} labels={eda.meta.varieties} />
            </div>
            <div className="lg:col-span-4">
              <CategoryPanel dim="soil" rows={rows} labels={eda.meta.soils} />
            </div>
            <div className="lg:col-span-4">
              <CategoryPanel dim="block" rows={rows} labels={eda.meta.blocks} />
            </div>

            <div className="lg:col-span-12">
              <SummaryTable rows={rows} eda={eda} />
            </div>
          </div>
        </section>

        <section id="dispersion" className="scroll-mt-36 pt-14">
          <SectionHeading
            index="02"
            kicker="Dispersion"
            title="How far the plots spread"
            description="Range, interquartile range, standard deviation and coefficient of variation, then the per-hectare spread by category and plot size."
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <YieldDistribution rows={rows} />
            </div>
            <div className="lg:col-span-5">
              <DispersionPanel rows={rows} />
            </div>

            <div className="lg:col-span-7">
              <DispersionBox rows={rows} eda={eda} />
            </div>
            <div className="lg:col-span-5">
              <ShapePanel rows={rows} />
            </div>
            <div className="lg:col-span-12">
              <DispersionContrast rows={rows} />
            </div>
          </div>
        </section>

        <section id="relationships" className="scroll-mt-36 pt-14">
          <SectionHeading
            index="03"
            kicker="Relationships"
            title="What moves together"
            description="Total yield tracks plot size closely. The correlation matrix switches between total and per-hectare outcomes; weather correlations are near zero. Association is not causation."
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <ScaleScatter rows={rows} varieties={eda.meta.varieties} />
            </div>
            <div className="lg:col-span-7">
              <CorrelationGrid rows={rows} />
            </div>

            <div className="lg:col-span-7">
              <WaterPanel windows={windows} block={filters.block} />
            </div>
            <div className="lg:col-span-5">
              <ClimatePanel windows={windows} />
            </div>
          </div>
        </section>

        <section id="interpretation" className="scroll-mt-36 pt-14">
          <SectionHeading
            index="04"
            kicker="Interpretation"
            title="What the evidence supports"
            description={`Six readings of the same dataset, followed by the caveats that limit them. Descriptive figures are recalculated for ${
              filtered
                ? summary.count === 0
                  ? 'the current filter selection'
                  : `the ${int(summary.count)} ${summary.count === 1 ? 'plot' : 'plots'} in view`
                : 'all 2,338 clean plots'
            }; ANOVA p-values, effect sizes and the weather audit stay full-sample.`}
          />
          <Interpretation eda={eda} rows={rows} filtered={filtered} />
        </section>

        <section id="method" className="scroll-mt-36 pt-14">
          <SectionHeading
            index="05"
            kicker="Data & method"
            title="Where the numbers come from"
            description="The audit trail behind the dashboard: duplicate removal, recording quirks and the static JSON pipeline. Full-sample ANOVA results and the weather audit are generated by the same script."
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <QualityPanel eda={eda} />
            </div>
            <div className="lg:col-span-7">
              <PipelinePanel eda={eda} />
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function PipelinePanel({ eda }: { eda: Eda }) {
  return (
    <Panel className="h-full border-transparent bg-forest-950 text-cream-50">
      <div className="grid h-full gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <p className="eyebrow text-[0.52rem] text-lime-300/70">Reproducible pipeline</p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight md:text-3xl">
            Raw file in. Static JSON out.
          </h2>
          <p className="mt-3 max-w-md text-[0.78rem] leading-relaxed text-cream-50/55">
            The dashboard never queries a database. A Python script profiles the raw CSV,
            de-duplicates it, engineers seven features and writes a single JSON payload with
            descriptive statistics and full-sample group comparisons.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-4 border-t border-cream-50/10 pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          {[
            { term: 'Raw rows', detail: int(eda.meta.rowsRaw) },
            { term: 'Clean plots', detail: int(eda.meta.rowsClean) },
            { term: 'Variables', detail: `${eda.meta.columns} + ${eda.meta.engineered}` },
          ].map((item) => (
            <div key={item.term}>
              <dt className="eyebrow text-[0.48rem] text-cream-50/35">{item.term}</dt>
              <dd className="mt-1.5 font-display text-xl font-medium text-lime-300 md:text-2xl">
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  )
}

function LoadingState() {
  return (
    <div className="shell flex min-h-[60vh] flex-col justify-center py-16">
      <p className="eyebrow text-[0.55rem] text-forest-900/40">Loading dataset</p>
      <p className="mt-3 font-display text-2xl text-forest-950">Reading 2,338 plots…</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl bg-cream-200/70" />
        ))}
      </div>
      <div className="mt-4 h-64 animate-pulse rounded-[1.5rem] bg-cream-200/50" aria-hidden="true" />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="shell flex min-h-[60vh] items-center py-16">
      <div className="max-w-lg rounded-[1.5rem] border border-clay-500/25 bg-cream-50 p-7">
        <p className="eyebrow text-[0.55rem] text-clay-600">Dataset unavailable</p>
        <h1 className="mt-3 font-display text-2xl font-medium text-forest-950">
          The JSON payload could not be loaded.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-forest-900/60">
          {message}. Run <code className="rounded bg-cream-200 px-1.5 py-0.5 text-xs">build_eda.py</code>{' '}
          to regenerate <code className="rounded bg-cream-200 px-1.5 py-0.5 text-xs">public/data/eda.json</code>.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-full bg-forest-900 px-5 py-2.5 text-[0.72rem] font-semibold text-cream-50 transition-colors hover:bg-forest-800"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

function DashboardFooter() {
  return (
    <footer className="border-t border-forest-900/10 bg-cream-100 py-8">
      <div className="shell flex flex-col gap-4 text-[0.64rem] text-forest-900/45 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="inline-flex items-center text-forest-900/70">
          <Logo iconClassName="h-5 w-5" />
        </Link>
        <p>ITC C307 · Foundation of Business Analytics · Group 9.2 — Tekiko &amp; Urbano</p>
        <p>Data: UCI Paddy Dataset (CC BY 4.0)</p>
      </div>
    </footer>
  )
}

