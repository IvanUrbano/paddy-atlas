import { motion, useScroll, useSpring } from 'motion/react'
import { useRef } from 'react'
import { pipeline } from '../../content/site'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'
import { SplitWords } from '../ui/SplitWords'

export function Method() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 85%'] })
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.35 })

  return (
    <section id="method" className="relative bg-cream-100 pb-24 pt-24 md:pb-32 md:pt-32">
      <div className="shell grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5 lg:self-start">
          <div className="lg:sticky lg:top-32">
            <SectionLabel index="06" label="Method" className="text-forest-900/55" />
            <SplitWords
              as="h2"
              lines={['From raw rows', 'to analysis.']}
              emphasis={['analysis.']}
              emphasisClassName="text-leaf-600"
              className="display-xl mt-8 text-forest-900"
            />

            <Reveal delay={0.15}>
              <p className="mt-7 max-w-md text-sm leading-relaxed text-forest-900/60">
                The Python pipeline reads the raw CSV, cleans it and computes the descriptive
                payload, including full-sample group comparisons. The dashboard reads the resulting
                eda.json and applies filters in the browser.
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="mt-9 max-w-sm overflow-hidden rounded-2xl border border-forest-900/12 bg-forest-950 p-5 text-[0.72rem] text-cream-50/70 shadow-xl shadow-forest-950/10">
                <div className="mb-3 flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-clay-500/70" />
                  <span className="h-2 w-2 rounded-full bg-sand-300/60" />
                  <span className="h-2 w-2 rounded-full bg-leaf-400/70" />
                </div>
                <pre className="overflow-x-auto font-mono leading-relaxed">
                  <code>
                    <span className="text-cream-50/35">&gt;&gt;&gt; </span>clean.shape
                    {'\n'}
                    <span className="text-lime-300">(2338, 52)</span>
                    {'\n'}
                    <span className="text-cream-50/35">&gt;&gt;&gt; </span>clean.duplicated().sum()
                    {'\n'}
                    <span className="text-lime-300">0</span>
                  </code>
                </pre>
              </div>
            </Reveal>
          </div>
        </div>

        <div ref={ref} className="relative lg:col-span-7">
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-forest-900/12" aria-hidden="true">
            <motion.div
              className="h-full w-full origin-top bg-leaf-600"
              style={{ scaleY }}
            />
          </div>

          <ol className="space-y-2">
            {pipeline.map((step, index) => (
              <Reveal key={step.index} delay={index * 0.05}>
                <li className="group relative rounded-2xl pl-10 transition-all duration-500 hover:translate-x-1 hover:bg-cream-50/70">
                  <span className="absolute left-0 top-7 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-forest-900/20 bg-cream-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-leaf-600" />
                  </span>

                  <div className="border-b border-forest-900/12 py-6 pr-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-4">
                        <span className="font-mono text-[0.68rem] text-forest-900/35">{step.index}</span>
                        <h3 className="font-display text-2xl font-medium tracking-tight text-forest-900 md:text-3xl">
                          {step.title}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.16em] ${
                          step.tag === 'next'
                            ? 'bg-sand-300 text-forest-900'
                            : 'border border-forest-900/15 text-forest-900/50'
                        }`}
                      >
                        {step.tag}
                      </span>
                    </div>
                    <p className="mt-3 max-w-lg text-[0.83rem] leading-relaxed text-forest-900/60">
                      {step.body}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-forest-900 px-6 py-5 text-cream-50">
              <p className="text-[0.78rem] text-cream-50/60">
                Next build: feature selection and yield regression on the same clean frame.
              </p>
              <span className="rounded-full bg-sand-300 px-3.5 py-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-forest-900">
                Planned
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
