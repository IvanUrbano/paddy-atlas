import { useEffect, useState } from 'react'

export const COLUMN = {
  hectares: 0,
  yield: 1,
  seedrate: 2,
  dap: 3,
  urea: 4,
  potash: 5,
  micronutrients: 6,
  pest: 7,
  rainFirst: 8,
  rainTotal: 9,
  humidity: 10,
  wind: 11,
  tempRange: 12,
  block: 13,
  variety: 14,
  soil: 15,
  nursery: 16,
} as const

export const COLUMN_LABELS = [
  'Plot size',
  'Yield',
  'Seed rate',
  'DAP 20d',
  'Urea 40d',
  'Potash 50d',
  'Micronutrients',
  'Pest control',
  'Early rain',
  'Season rain',
  'Humidity',
  'Wind',
  'Temp range',
  'Agriblock',
  'Variety',
  'Soil',
  'Nursery',
]

export type Filters = {
  variety: string
  soil: string
  block: string
  nursery: string
  size: string
}

export const EMPTY_FILTERS: Filters = {
  variety: 'all',
  soil: 'all',
  block: 'all',
  nursery: 'all',
  size: 'all',
}

export type WeatherWindow = {
  key: string
  label: string
  rain: number
  irrigation: number
  minTemp: number
  maxTemp: number
  humidity: number
  wind: number
}

export type Meta = {
  title: string
  source: string
  doi: string
  license: string
  creator: string
  rowsRaw: number
  rowsClean: number
  duplicates: number
  columns: number
  engineered: number
  blocks: string[]
  varieties: string[]
  soils: string[]
  nurseries: string[]
  yield: { min: number; q1: number; median: number; q3: number; max: number; mean: number; std: number }
  yieldPerHa: { min: number; q1: number; median: number; q3: number; max: number; mean: number; std: number }
  hectares: { min: number; q1: number; median: number; q3: number; max: number; mean: number; std: number }
}

export type Eda = {
  meta: Meta
  weather: {
    overall: WeatherWindow[]
    byBlock: Record<string, WeatherWindow[]>
  }
  audit: {
    windLow: {
      value: number
      window: string
      count: number
      share: number
      blocks: Record<string, number>
      values: number[]
      max: number
    }
    rainFirstWindow: { min: number; max: number }
    hectaresYieldCorrelation: number
    perHectareSpread: { min: number; max: number }
  }
  rows: number[][]
}

type State = {
  data: Eda | null
  error: string | null
  loading: boolean
}

export function useEda(): State {
  const [state, setState] = useState<State>({ data: null, error: null, loading: true })

  useEffect(() => {
    let alive = true

    fetch(`${import.meta.env.BASE_URL}data/eda.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed with ${response.status}`)
        return response.json() as Promise<Eda>
      })
      .then((data) => {
        if (alive) setState({ data, error: null, loading: false })
      })
      .catch((error: unknown) => {
        if (alive) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : 'Could not load the dataset',
            loading: false,
          })
        }
      })

    return () => {
      alive = false
    }
  }, [])

  return state
}
