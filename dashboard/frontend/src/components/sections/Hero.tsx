import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { heroFacts } from '../../content/site'
import { scrollToId } from '../../lib/scroll'
import { Img } from '../ui/Img'
import { MagneticButton } from '../ui/MagneticButton'
import { Marquee } from '../ui/Marquee'
import { SplitWords } from '../ui/SplitWords'

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.14])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -70])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const hillsY = useTransform(scrollYProgress, [0, 1], [0, 60])

  return (
    <section
      ref={ref}
      id="top"
      className="relative isolate min-h-[100svh] overflow-hidden bg-forest-950 text-cream-50"
    >
      <motion.div
        className="absolute inset-0 -z-10"
        style={reduce ? undefined : { y: bgY, scale: bgScale }}
      >
        <Img
          name="hero"
          priority
          className="h-full w-full"
          imgClassName="h-full w-full object-cover object-[50%_58%]"
          sizes="100vw"
        />
      </motion.div>

      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-forest-950/80 via-forest-950/35 to-forest-950/95" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_15%_10%,rgba(4,22,15,0.15),rgba(4,22,15,0.85))]" />

      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-[26vh]"
        style={reduce ? undefined : { y: hillsY }}
      >
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute bottom-0 h-full w-full text-forest-950/85"
          aria-hidden="true"
        >
          <path
            d="M0,206 C150,150 300,238 470,224 C660,208 780,120 980,142 C1160,162 1300,214 1440,192 L1440,320 L0,320 Z"
            fill="currentColor"
          />
        </svg>
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute -bottom-1 h-[62%] w-full text-forest-900"
          aria-hidden="true"
        >
          <path
            d="M0,244 C200,200 330,268 520,256 C720,244 860,196 1040,214 C1230,233 1350,262 1440,248 L1440,320 L0,320 Z"
            fill="currentColor"
          />
        </svg>
      </motion.div>

      <div className="shell relative z-10 flex min-h-[100svh] flex-col justify-between pt-28 pb-8 md:pt-36 md:pb-11">
        <div className="flex items-start justify-between gap-8">
          <p className="eyebrow max-w-[26ch] text-cream-50/60">
            ITC C307 · A business-analytics study of 2,338 paddy plots
          </p>
          <div className="hidden shrink-0 items-center gap-3 rounded-full border border-cream-50/20 bg-forest-950/20 px-4 py-2 backdrop-blur-md sm:flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-lime-300" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime-300" />
            </span>
            <span className="eyebrow text-[0.58rem] text-cream-50/70">UCI Paddy Dataset · CC BY 4.0</span>
          </div>
        </div>

        <motion.div
          className="mt-16 grid items-end gap-10 lg:grid-cols-12"
          style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
        >
          <div className="lg:col-span-8">
            <SplitWords
              as="h1"
              lines={['What the', 'paddy data', 'says.']}
              emphasis={['data']}
              emphasisClassName="text-lime-300"
              className="display-hero text-cream-50"
            />
          </div>

          <div className="lg:col-span-4 lg:pb-3">
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="lede max-w-sm text-cream-50/75"
            >
              Paddy Atlas profiles 2,338 harvests in Tamil Nadu — 120 days of weather, soil and
              farm decisions measured against one outcome: yield. No sales pitch, just the data.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <MagneticButton variant="solid" to="/dashboard">
                Open the dashboard
              </MagneticButton>
              <MagneticButton
                variant="outline"
                arrow={false}
                onClick={() => scrollToId('method')}
                className="text-cream-50"
              >
                Read the method
              </MagneticButton>
            </motion.div>
          </div>
        </motion.div>

        <div className="mt-14 border-t border-cream-50/15 pt-6 md:mt-20">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <dl className="grid flex-1 grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              {heroFacts.map((fact, index) => (
                <motion.div
                  key={fact.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  <dt className="font-display text-2xl font-medium tracking-tight text-cream-50 md:text-3xl">
                    {fact.value}
                  </dt>
                  <dd className="eyebrow mt-1.5 text-[0.56rem] text-cream-50/45">{fact.label}</dd>
                </motion.div>
              ))}
            </dl>

            <button
              type="button"
              onClick={() => scrollToId('overview')}
              className="group flex items-center gap-3"
              data-cursor="hover"
            >
              <span className="relative block h-12 w-px overflow-hidden bg-cream-50/20">
                <span className="absolute inset-x-0 top-0 block h-4 animate-scroll-dot bg-lime-300" />
              </span>
              <span className="eyebrow text-[0.56rem] text-cream-50/50 transition-colors duration-500 group-hover:text-cream-50">
                Scroll to explore
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-cream-50/10 bg-forest-950/50 py-3 text-[0.6rem] backdrop-blur-sm">
        <Marquee
          items={[
            'Descriptive analytics',
            'Exploratory data analysis',
            'Six agriblocks',
            'Three varieties',
            'Forty-five variables',
            'One outcome',
          ]}
          className="text-cream-50/40 uppercase tracking-[0.28em]"
        />
      </div>
    </section>
  )
}
