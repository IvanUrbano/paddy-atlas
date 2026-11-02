import { useEffect, useState, type FormEvent } from 'react'
import type { Eda } from '../../data/eda'
import { Panel } from './primitives'

type Prediction = {
  yield_per_ha_kg: number
  total_yield_kg: number
  interval_90_kg_per_ha: [number, number]
  extrapolation: boolean
  warnings: string[]
  model_trained_at: string
}

type FormValues = {
  hectares: number
  trashPerHa: number
  agriblock: string
  variety: string
  soil_types: string
  nursery: string
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

function getError(error: unknown): string {
  return error instanceof Error ? error.message : 'The prediction could not be completed.'
}

export function PredictionPanel({ eda }: { eda: Eda }) {
  const [form, setForm] = useState<FormValues>({
    hectares: 4,
    trashPerHa: 90,
    agriblock: eda.meta.blocks.includes('Cuddalore') ? 'Cuddalore' : eda.meta.blocks[0],
    variety: eda.meta.varieties[0],
    soil_types: eda.meta.soils[0],
    nursery: eda.meta.nurseries[0],
  })
  const [online, setOnline] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Prediction | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_URL}/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Prediction service unavailable')
        setOnline(true)
      })
      .catch(() => setOnline(false))
      .finally(() => setChecking(false))
    return () => controller.abort()
  }, [])

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setResult(null)
    setError('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hectares: form.hectares,
          trash: form.hectares * form.trashPerHa,
          agriblock: form.agriblock,
          variety: form.variety,
          soil_types: form.soil_types,
          nursery: form.nursery,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Please check the input values.')
      setResult(body as Prediction)
      setOnline(true)
    } catch (cause) {
      setOnline(false)
      setError(getError(cause))
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = 'mt-2 w-full rounded-xl border border-forest-900/15 bg-cream-100 px-4 py-3 text-sm text-forest-950 outline-none focus:border-leaf-600 focus:ring-2 focus:ring-leaf-600/15'
  const labelClass = 'block text-xs font-semibold text-forest-900/75'

  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-[0.55rem] text-leaf-600">CatBoost yield model</p>
            <h3 className="mt-2 font-display text-2xl font-medium text-forest-950">Estimate a field's harvest</h3>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${online ? 'bg-lime-200 text-forest-900' : 'bg-cream-200 text-forest-900/60'}`}>
            {checking ? 'Checking model…' : online ? 'Model ready' : 'Model service offline'}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-forest-900/60">
          Choose a field profile observed in the dataset. The result estimates kilograms per hectare and total kilograms for the selected area.
        </p>

        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Plot size
            <select className={fieldClass} value={form.hectares} onChange={(event) => update('hectares', Number(event.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} hectare{value > 1 ? 's' : ''}</option>)}
            </select>
          </label>
          <label className={labelClass}>Trash per hectare
            <input className={fieldClass} type="number" min="80" max="100" step="1" required value={form.trashPerHa} onChange={(event) => update('trashPerHa', Number(event.target.value))} />
            <span className="mt-1 block text-[0.65rem] font-normal text-forest-900/45">Observed range: 80–100 in dataset units</span>
          </label>
          {([
            ['agriblock', 'Agriblock', eda.meta.blocks],
            ['variety', 'Paddy variety', eda.meta.varieties],
            ['soil_types', 'Soil type', eda.meta.soils],
            ['nursery', 'Nursery method', eda.meta.nurseries],
          ] as const).map(([key, label, options]) => (
            <label className={labelClass} key={key}>{label}
              <select className={fieldClass} value={form[key]} onChange={(event) => update(key, event.target.value)}>
                {options.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          ))}
          <div className="sm:col-span-2">
            <button type="submit" disabled={loading || !online} className="rounded-full bg-forest-900 px-6 py-3 text-sm font-semibold text-cream-50 transition-colors hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Estimating…' : 'Estimate yield'}
            </button>
            {!online && !checking ? <p className="mt-3 text-xs text-clay-600">Start the local model service, then refresh this page. The GitHub Pages site also needs a hosted API to make live predictions.</p> : null}
            {error ? <p role="alert" className="mt-3 text-xs text-clay-600">{error}</p> : null}
          </div>
        </form>
      </Panel>

      <Panel className="flex flex-col justify-between border-transparent bg-forest-950 text-cream-50">
        <div>
          <p className="eyebrow text-[0.55rem] text-lime-300">Prediction result</p>
          {result ? (
            <div aria-live="polite" className="mt-7">
              <p className="text-sm text-cream-50/55">Estimated yield per hectare</p>
              <p className="mt-2 font-display text-4xl font-medium text-lime-300">{number.format(result.yield_per_ha_kg)} <span className="text-lg text-cream-50/70">kg/ha</span></p>
              <div className="mt-7 border-t border-cream-50/15 pt-5">
                <p className="text-sm text-cream-50/55">Estimated total harvest</p>
                <p className="mt-1 font-display text-2xl">{number.format(result.total_yield_kg)} kg</p>
              </div>
              <div className="mt-5 border-t border-cream-50/15 pt-5">
                <p className="text-sm text-cream-50/55">Approximate 90% range per hectare</p>
                <p className="mt-1 text-lg">{number.format(result.interval_90_kg_per_ha[0])}–{number.format(result.interval_90_kg_per_ha[1])} kg</p>
              </div>
              {result.warnings.map((warning) => <p className="mt-4 text-xs text-sand-300" key={warning}>{warning}</p>)}
            </div>
          ) : <p className="mt-8 text-sm leading-relaxed text-cream-50/55">Select field details and estimate yield to see the model's result here.</p>}
        </div>
        <p className="mt-10 border-t border-cream-50/15 pt-5 text-xs leading-relaxed text-cream-50/45">
          Five-fold validation on 2,338 plots: average error 158.9 kg/ha. This is an estimate from observed patterns, not a guaranteed harvest or a causal effect.
        </p>
      </Panel>
    </div>
  )
}
