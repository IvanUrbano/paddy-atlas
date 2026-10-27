export function int(value: number) {
  return Math.round(value).toLocaleString('en-US')
}

export function kg(value: number) {
  return `${int(value)} kg`
}

export function perHa(value: number) {
  return `${int(value)} kg/ha`
}

export function decimal(value: number, digits = 1) {
  return value.toFixed(digits)
}

export function correlation(value: number) {
  return value.toFixed(2)
}

export function correlation3(value: number) {
  return value.toFixed(3)
}

export function pValue(value: number) {
  return value < 0.001 ? '< 0.001' : value.toFixed(3)
}

export function compact(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )
}
