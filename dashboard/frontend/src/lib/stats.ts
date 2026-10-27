export function mean(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

export function quantile(values: number[], q: number) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const position = (sorted.length - 1) * q
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]
  const weight = position - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

export function median(values: number[]) {
  return quantile(values, 0.5)
}

export function stdev(values: number[]) {
  if (values.length < 2) return 0
  const average = mean(values)
  const variance =
    values.reduce((total, value) => total + (value - average) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

export function pearson(xs: number[], ys: number[]) {
  const size = Math.min(xs.length, ys.length)
  if (size < 2) return 0
  const meanX = mean(xs.slice(0, size))
  const meanY = mean(ys.slice(0, size))
  let covariance = 0
  let varianceX = 0
  let varianceY = 0
  for (let index = 0; index < size; index += 1) {
    const dx = xs[index] - meanX
    const dy = ys[index] - meanY
    covariance += dx * dy
    varianceX += dx * dx
    varianceY += dy * dy
  }
  if (varianceX === 0 || varianceY === 0) return 0
  return covariance / Math.sqrt(varianceX * varianceY)
}

export function etaSquared(values: number[], groups: number[]) {
  const size = Math.min(values.length, groups.length)
  if (size < 2) return 0
  const grand = mean(values.slice(0, size))
  const buckets = new Map<number, number[]>()
  for (let index = 0; index < size; index += 1) {
    const bucket = buckets.get(groups[index])
    if (bucket) bucket.push(values[index])
    else buckets.set(groups[index], [values[index]])
  }
  let between = 0
  for (const bucket of buckets.values()) {
    between += bucket.length * (mean(bucket) - grand) ** 2
  }
  const total = values.slice(0, size).reduce((sum, value) => sum + (value - grand) ** 2, 0)
  return total === 0 ? 0 : between / total
}

export type Bin = {
  label: string
  from: number
  to: number
  count: number
}

export function histogram(values: number[], bins = 24, digits = 0): Bin[] {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(max - min, 1)
  const width = span / bins
  const counts = new Array<number>(bins).fill(0)

  for (const value of values) {
    const index = Math.min(bins - 1, Math.floor((value - min) / width))
    counts[index] += 1
  }

  const format = (value: number) => (value / 1000).toFixed(digits)

  return counts.map((count, index) => {
    const from = min + width * index
    const to = from + width
    return {
      label: `${format(from)}–${format(to)}k`,
      from,
      to,
      count,
    }
  })
}

export type Summary = {
  count: number
  mean: number
  median: number
  q1: number
  q3: number
  min: number
  max: number
  range: number
  iqr: number
  sd: number
  cv: number
}

export function summarize(values: number[]): Summary {
  const average = mean(values)
  const middle = median(values)
  const q1 = quantile(values, 0.25)
  const q3 = quantile(values, 0.75)
  const sd = stdev(values)
  return {
    count: values.length,
    mean: average,
    median: middle,
    q1,
    q3,
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
    range: values.length ? Math.max(...values) - Math.min(...values) : 0,
    iqr: q3 - q1,
    sd,
    cv: average === 0 ? 0 : (sd / Math.abs(average)) * 100,
  }
}

export function mode(values: number[]) {
  const counts = new Map<number, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  let winner: { value: number; count: number } | null = null
  for (const [value, count] of counts) {
    if (!winner || count > winner.count) winner = { value, count }
  }
  return winner
}

export function linearFit(xs: number[], ys: number[]) {
  const size = Math.min(xs.length, ys.length)
  if (size < 2) return { slope: 0, intercept: 0, r2: 0 }
  const meanX = mean(xs.slice(0, size))
  const meanY = mean(ys.slice(0, size))
  let covariance = 0
  let variance = 0
  for (let index = 0; index < size; index += 1) {
    covariance += (xs[index] - meanX) * (ys[index] - meanY)
    variance += (xs[index] - meanX) ** 2
  }
  const slope = variance === 0 ? 0 : covariance / variance
  const intercept = meanY - slope * meanX
  return { slope, intercept, r2: pearson(xs, ys) ** 2 }
}

export function skewness(values: number[]) {
  if (values.length < 3) return 0
  const average = mean(values)
  const sd = Math.sqrt(
    values.reduce((total, value) => total + (value - average) ** 2, 0) / values.length,
  )
  if (sd === 0) return 0
  return values.reduce((total, value) => total + ((value - average) / sd) ** 3, 0) / values.length
}

export function excessKurtosis(values: number[]) {
  if (values.length < 4) return 0
  const average = mean(values)
  const sd = Math.sqrt(
    values.reduce((total, value) => total + (value - average) ** 2, 0) / values.length,
  )
  if (sd === 0) return 0
  const fourth = values.reduce(
    (total, value) => total + ((value - average) / sd) ** 4,
    0,
  )
  return fourth / values.length - 3
}

export function iqrOutliers(values: number[]) {
  const q1 = quantile(values, 0.25)
  const q3 = quantile(values, 0.75)
  const spread = q3 - q1
  const low = q1 - 1.5 * spread
  const high = q3 + 1.5 * spread
  return {
    low,
    high,
    count: values.filter((value) => value < low || value > high).length,
  }
}

export type GroupStat = {
  name: string
  count: number
  meanYield: number
  medianYield: number
  perHa: number
  min: number
  max: number
}

export function groupStats(
  rows: number[][],
  index: number,
  labels: string[],
): GroupStat[] {
  const buckets = new Map<number, number[][]>()
  for (const row of rows) {
    const key = row[index]
    const bucket = buckets.get(key)
    if (bucket) bucket.push(row)
    else buckets.set(key, [row])
  }

  return labels
    .map((name, key) => {
      const bucket = buckets.get(key) ?? []
      const yields = bucket.map((row) => row[1])
      return {
        name,
        count: bucket.length,
        meanYield: mean(yields),
        medianYield: median(yields),
        perHa: mean(bucket.map((row) => row[1] / row[0])),
        min: yields.length ? Math.min(...yields) : 0,
        max: yields.length ? Math.max(...yields) : 0,
      }
    })
    .filter((stat) => stat.count > 0)
}
