import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { overviewFacts } from '../../content/site'
import { Img } from '../ui/Img'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'
import { SplitWords } from '../ui/SplitWords'

function SproutMark() {
  return (
    <svg viewBox="0 0 120 160" className="h-28 w-24 text-leaf-600" fill="none" aria-hidden="true">
      <motion.path
        d="M60 152V64"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d="M60 104C36 104 24 92 24 68c24 0 36 12 36 36Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 1.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d="M60 86c24 0 36-12 36-36-24 0-36 12-36 36Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d="M60 62V38"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2 6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9, duration: 1 }}
      />
    </svg>
  )
}

export function Manifesto() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], [42, -42])
  const circleY = useTransform(scrollYProgress, [0, 1], [-18, 28])

  return (
    <section
      ref={ref}
      id="overview"
      className="relative z-10 bg-cream-100 pb-20 pt-20 md:pb-28 md:pt-28"
    >
      <div className="shell">
        <SectionLabel index="01" label="Overview" className="text-forest-900/60" />

        <div className="mt-12 grid gap-16 lg:mt-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6 lg:self-start">
            <SplitWords
              as="h2"
              lines={['Rice feeds half', 'the world. We', 'read the data', 'behind every', 'hectare.']}
              emphasis={['data']}
              emphasisClassName="text-leaf-600"
              className="display-xl text-forest-900"
            />

            <Reveal delay={0.15}>
              <p className="lede mt-8 max-w-lg text-forest-900/70">
                Paddy Atlas is a business-analytics case study built on the UCI Paddy Dataset: 2,789
                field records from six agriblocks in Tamil Nadu, each one tracing a single crop from
                nursery to harvest.
              </p>
            </Reveal>

            <Reveal delay={0.22}>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-forest-900/55">
                Forty-five variables cover farm size, variety, soil, seed rate, fertilizer,
                pesticide, and rainfall, temperature, humidity and wind across four growth windows.
                After a full profiling pass, 451 duplicate rows leave the working set at 2,338 clean
                plots — the number every chart on this page answers to.
              </p>
            </Reveal>

            <div className="mt-10 flex items-end gap-6">
              <SproutMark />
              <div className="pb-3">
                <p className="eyebrow text-forest-900/40">Nursery → harvest</p>
                <p className="mt-2 max-w-[18ch] font-display text-lg leading-tight text-forest-900/80">
                  Every plot is a four-act story told in weather.
                </p>
              </div>
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <motion.div
              initial={{ clipPath: 'inset(14% 14% 14% 14% round 48px)', opacity: 0.4 }}
              whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 32px)', opacity: 1 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <motion.div style={reduce ? undefined : { y: imageY }}>
                <Img
                  name="field"
                  className="aspect-[4/5] w-full sm:aspect-[5/6]"
                  imgClassName="h-full w-full scale-[1.08] object-cover"
                  sizes="(min-width: 1024px) 46vw, 100vw"
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={reduce ? undefined : { y: circleY }}
              className="absolute -bottom-8 left-2 w-32 overflow-hidden rounded-full ring-8 ring-cream-100 sm:-left-6 sm:w-44"
            >
              <Img
                name="planting"
                className="aspect-square w-full"
                imgClassName="h-full w-full object-cover"
                sizes="176px"
              />
            </motion.div>

            <Reveal delay={0.4}>
              <div className="absolute -right-1 top-6 rounded-2xl bg-forest-900 px-5 py-4 text-cream-50 shadow-2xl shadow-forest-950/20 sm:-right-4">
                <p className="font-display text-2xl font-medium tracking-tight">2,338</p>
                <p className="eyebrow mt-1 text-[0.52rem] text-cream-50/50">clean plots</p>
              </div>
            </Reveal>

            <p className="mt-14 text-[0.66rem] uppercase tracking-[0.22em] text-forest-900/35 sm:mt-12">
              Plate 01 — transplanted paddy, irrigated belt
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-y-8 border-t border-forest-900/15 pt-8 md:mt-24 md:grid-cols-4">
          {overviewFacts.map((fact, index) => (
            <Reveal key={fact.label} delay={index * 0.06} className="pr-6">
              <p className="eyebrow text-[0.56rem] text-forest-900/40">{fact.label}</p>
              <p className="mt-2 font-display text-lg tracking-tight text-forest-900 md:text-xl">
                {fact.value}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
