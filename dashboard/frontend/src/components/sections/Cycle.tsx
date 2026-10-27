import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useRef, useState } from 'react'
import { stages } from '../../content/site'
import { Img } from '../ui/Img'
import { SectionLabel } from '../ui/SectionLabel'

const count = stages.length

function StageImage({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const start = index / count
  const end = (index + 1) / count
  const isFirst = index === 0
  const isLast = index === count - 1

  const input = isFirst
    ? [0, 0.02, end - 0.03, end + 0.09]
    : isLast
      ? [start - 0.09, start + 0.03, 0.9999, 1]
      : [start - 0.09, start + 0.03, end - 0.03, end + 0.09]

  const output = isFirst
    ? [1, 1, 1, 0]
    : isLast
      ? [0, 1, 1, 1]
      : [0, 1, 1, 0]

  const opacity = useTransform(progress, input, output)
  const scale = useTransform(progress, [start, end], [1.16, 1.02])

  return (
    <motion.div className="absolute inset-0" style={{ opacity, scale }}>
      <Img
        name={stages[index].image}
        className="h-full w-full"
        imgClassName="h-full w-full object-cover"
        sizes="(min-width: 1024px) 58vw, 100vw"
      />
    </motion.div>
  )
}

export function Cycle() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = Math.min(count - 1, Math.max(0, Math.floor(value * count)))
    setActive((current) => (current === next ? current : next))
  })

  const stage = stages[active]

  return (
    <div ref={wrapperRef} id="cycle" className="relative h-[340vh] bg-forest-950 lg:h-[420vh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 field-lines text-cream-50 opacity-20" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 font-display text-[26vw] font-semibold leading-none text-cream-50/[0.035] lg:block"
        >
          {stage.index}
        </span>

        <div className="shell relative grid w-full items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <SectionLabel index="05" label="The cycle" className="text-cream-50/55" />

            <div className="mt-7 flex items-baseline gap-4">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${stage.index}-num`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-6xl font-medium leading-none text-lime-300 lg:text-7xl"
                >
                  {stage.index}
                </motion.span>
              </AnimatePresence>
              <span className="eyebrow text-cream-50/45">{stage.window}</span>
            </div>

            <div className="relative mt-5 min-h-[15rem] lg:min-h-[17rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stage.index}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h2 className="display-lg text-cream-50">{stage.title}.</h2>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-cream-50/60">
                    {stage.body}
                  </p>
                  <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-cream-50/12 pt-5">
                    {stage.metrics.map((metric) => (
                      <div key={metric.label}>
                        <dt className="text-[0.55rem] uppercase tracking-[0.16em] text-cream-50/35">
                          {metric.label}
                        </dt>
                        <dd className="mt-1.5 text-[0.8rem] font-semibold text-cream-50/85">
                          {metric.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-2 flex gap-2">
              {stages.map((item, index) => (
                <span
                  key={item.index}
                  className={`h-[2px] flex-1 transition-colors duration-500 ${
                    index <= active ? 'bg-lime-300' : 'bg-cream-50/15'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7">
            <div className="relative h-[36svh] w-full overflow-hidden rounded-[1.75rem] sm:h-[42svh] lg:h-auto lg:aspect-[5/6]">
              {stages.map((item, index) => (
                <StageImage key={item.index} index={index} progress={scrollYProgress} />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-forest-950/20" />
              <div className="absolute inset-x-5 bottom-5 flex items-center justify-between">
                <span className="rounded-full border border-cream-50/25 bg-forest-950/30 px-3.5 py-1.5 text-[0.56rem] uppercase tracking-[0.18em] text-cream-50/75 backdrop-blur-md">
                  {stage.window}
                </span>
                <span className="text-[0.56rem] uppercase tracking-[0.18em] text-cream-50/50">
                  Paddy · {stage.title}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
