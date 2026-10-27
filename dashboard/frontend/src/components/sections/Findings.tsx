import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { findings } from '../../content/site'
import { Img } from '../ui/Img'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'
import { SplitWords } from '../ui/SplitWords'

type Finding = (typeof findings)[number]

function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false)

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-forest-900/10 bg-cream-50">
      <div className="relative overflow-hidden">
        <Img
          name={finding.image}
          className="aspect-[16/10] w-full"
          imgClassName="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-[1.04]"
          sizes="(min-width: 1024px) 55vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/35 to-transparent" />
        <span className="absolute left-5 top-5 rounded-full border border-cream-50/30 bg-forest-950/25 px-3 py-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-cream-50 backdrop-blur-md">
          {finding.tag}
        </span>
      </div>

      <div className="p-6 md:p-8">
        <p className="text-[0.58rem] uppercase tracking-[0.18em] text-forest-900/35">{finding.meta}</p>
        <h3 className="mt-3 font-display text-2xl font-medium leading-tight tracking-tight text-forest-900 md:text-[1.9rem]">
          {finding.title}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-forest-900/60">{finding.excerpt}</p>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="mt-6 inline-flex items-center gap-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-forest-900/70 transition-colors duration-300 hover:text-forest-900"
          data-cursor="hover"
        >
          {open ? 'Close the note' : 'Read the note'}
          <span
            className={`grid h-6 w-6 place-items-center rounded-full border border-forest-900/20 transition-transform duration-500 ${
              open ? 'rotate-45' : ''
            }`}
          >
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="mt-5 border-t border-forest-900/10 pt-5 text-sm leading-relaxed text-forest-900/65">
                {finding.detail}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  )
}

export function Findings() {
  return (
    <section id="findings" className="relative overflow-hidden bg-sand-200 pb-24 pt-24 md:pb-32 md:pt-32">
      <div className="shell">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionLabel index="07" label="Findings" className="text-forest-900/55" />
            <SplitWords
              as="h2"
              lines={['What the data', 'insisted on.']}
              emphasis={['insisted']}
              emphasisClassName="text-clay-600"
              className="display-xl mt-8 text-forest-900"
            />
          </div>
          <Reveal delay={0.15} className="max-w-sm lg:pb-2">
            <p className="text-sm leading-relaxed text-forest-900/55">
              Three notes from the exploratory pass — the moments where the dataset corrected an
              assumption instead of confirming one.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <FindingCard finding={findings[0]} />
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-5 lg:mt-16">
            <FindingCard finding={findings[1]} />
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-8 lg:col-start-3">
            <FindingCard finding={findings[2]} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
