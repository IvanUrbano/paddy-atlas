import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

type Props = {
  value: number
  suffix?: string
  prefix?: string
  decimals?: number
  duration?: number
  className?: string
}

export function Counter({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 1.9,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const reduce = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node || !inView) return

    const format = (input: number) =>
      `${prefix}${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(input)}${suffix}`

    if (reduce) {
      node.textContent = format(value)
      return
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = format(latest)
      },
    })

    return () => controls.stop()
  }, [inView, value, suffix, prefix, decimals, duration, reduce])

  return (
    <span ref={ref} className={className}>
      {prefix}
      0
      {suffix}
    </span>
  )
}
