import { motion, useReducedMotion } from 'motion/react'
import { stats } from '../../content/site'
import { Counter } from '../ui/Counter'
import { Marquee } from '../ui/Marquee'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'
import { SplitWords } from '../ui/SplitWords'

const windows = ['D1–30', 'D31–60', 'D61–90', 'D91–120']
const rainfall = [18.85, 186.2, 166.15, 60.5]
const irrigation = [21.15, 271.8, 250.85, 64.5]
const max = 272

export function Impact() {
  const reduce = useReducedMotion()

  return (
    <section id="impact" className="relative overflow-hidden bg-forest-950 text-cream-50">
      <div className="pointer-events-none absolute inset-0 field-lines text-cream-50 opacity-[0.35]" />

      <div className="shell relative py-24 md:py-32">
        <SectionLabel index="02" label="Impact" className="text-cream-50/55" />

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
          <SplitWords
            as="h2"
            lines={['Numbers that grew', 'out of the soil.']}
            emphasis={['soil.']}
            emphasisClassName="text-lime-300"
            className="display-xl text-cream-50 lg:col-span-7"
          />
          <Reveal delay={0.15} className="lg:col-span-4 lg:col-start-9">
            <p className="text-sm leading-relaxed text-cream-50/55">
              Every figure below comes from the same cleaned frame. Nothing is estimated, nothing is
              rounded up — duplicates are gone, types are fixed, and the outcome is measured in
              kilograms per plot.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.08}>
              <div className="border-t border-cream-50/15 pt-6">
                <p className="font-display text-[clamp(2.75rem,5vw,4.5rem)] font-medium leading-none tracking-[-0.04em] text-cream-50">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-4 text-sm font-semibold text-lime-300">{stat.label}</p>
                <p className="mt-2 text-xs leading-relaxed text-cream-50/45">{stat.note}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow text-cream-50/40">Water by growth window</p>
            <p className="mt-4 max-w-xs font-display text-xl leading-snug text-cream-50/85">
              Irrigation peaks between day 31 and 60 — where the crop builds its structure.
            </p>
            <div className="mt-6 flex flex-wrap gap-5 text-[0.62rem] uppercase tracking-[0.16em] text-cream-50/45">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-lime-300" /> Rainfall
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-leaf-400" /> Irrigation
              </span>
            </div>
          </Reveal>

          <div className="lg:col-span-8">
            <div className="space-y-7">
              {windows.map((window, index) => (
                <div key={window}>
                  <div className="mb-2 flex items-baseline justify-between text-[0.62rem] uppercase tracking-[0.16em] text-cream-50/40">
                    <span>{window}</span>
                    <span className="font-sans normal-case tracking-normal text-cream-50/55">
                      {rainfall[index].toFixed(1)} mm rain · {irrigation[index].toFixed(1)} mm irrigation
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2.5 overflow-hidden rounded-full bg-cream-50/8">
                      <motion.div
                        className="h-full rounded-full bg-lime-300"
                        initial={reduce ? { width: `${(rainfall[index] / max) * 100}%` } : { width: 0 }}
                        whileInView={{ width: `${(rainfall[index] / max) * 100}%` }}
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 1.2, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-cream-50/8">
                      <motion.div
                        className="h-full rounded-full bg-leaf-400"
                        initial={reduce ? { width: `${(irrigation[index] / max) * 100}%` } : { width: 0 }}
                        whileInView={{ width: `${(irrigation[index] / max) * 100}%` }}
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 1.2, delay: 0.1 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-[0.62rem] uppercase tracking-[0.16em] text-cream-50/30">
              Observed midpoints of each published range · millimetres
            </p>
          </div>
        </div>
      </div>

      <div className="relative border-t border-cream-50/10 py-4 text-[0.62rem]">
        <Marquee
          items={[
            'Clean data',
            'Honest ranges',
            '120 days per plot',
            'Six agriblocks',
            'Three varieties',
            'One outcome in kilograms',
          ]}
          className="text-cream-50/35 uppercase tracking-[0.26em]"
        />
      </div>
    </section>
  )
}
