import { useEffect, useRef } from 'react'
import { variables } from '../../content/site'
import { gsap } from '../../lib/gsap'
import { Img } from '../ui/Img'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'
import { SplitWords } from '../ui/SplitWords'

export function Variables() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    const bar = progressRef.current
    if (!section || !track || !bar) return

    const mm = gsap.matchMedia()

    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 120)

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.9,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(bar, { scaleX: self.progress })
          },
        },
      })

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
        gsap.set(track, { x: 0 })
        gsap.set(bar, { scaleX: 0 })
      }
    })

    return () => mm.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="variables"
      className="relative overflow-hidden bg-forest-950 text-cream-50 lg:h-[100svh]"
    >
      <div className="pointer-events-none absolute inset-0 field-lines text-cream-50 opacity-25" />

      <div className="relative flex h-full flex-col justify-center py-20 lg:py-0">
        <div className="shell flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel index="04" label="Variables" className="text-cream-50/55" />
            <SplitWords
              as="h2"
              lines={['The variables', 'in the dataset.']}
              emphasis={['variables']}
              emphasisClassName="text-lime-300"
              className="display-lg mt-6 text-cream-50"
            />
          </div>
          <Reveal delay={0.15} className="max-w-xs pb-2">
            <p className="text-xs leading-relaxed text-cream-50/50">
              Forty-five source fields in five groups. Scroll to review the farm traits, inputs and
              weather records used in the analysis.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 overflow-x-auto pb-4 hide-scrollbar lg:mt-12 lg:overflow-visible lg:pb-0">
          <div
            ref={trackRef}
            data-track
            className="flex w-max items-stretch gap-4 px-[clamp(1.25rem,4vw,4.75rem)] will-change-transform lg:gap-6"
          >
            {variables.map((variable) => (
              <article
                key={variable.title}
                className="group relative flex w-[78vw] shrink-0 flex-col overflow-hidden rounded-[1.5rem] border border-cream-50/12 bg-forest-900/60 sm:w-[56vw] md:w-[42vw] lg:w-[30vw] xl:w-[26vw]"
                data-cursor="hover"
              >
                <div className="relative aspect-[5/4] overflow-hidden">
                  <Img
                    name={variable.image}
                    className="h-full w-full"
                    imgClassName="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                    sizes="(min-width: 1280px) 26vw, (min-width: 1024px) 30vw, 78vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/10 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-cream-50/25 bg-forest-950/35 px-3 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.2em] text-cream-50/80 backdrop-blur-md">
                    {variable.index}
                  </span>
                  <p className="absolute bottom-4 left-5 right-5 font-display text-2xl font-medium tracking-tight text-cream-50">
                    {variable.title}
                  </p>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="font-display text-lg tracking-tight text-lime-300">{variable.value}</p>
                  <p className="mt-2.5 text-[0.8rem] leading-relaxed text-cream-50/55">
                    {variable.body}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-1.5 border-t border-cream-50/10 pt-4">
                    {variable.meta.map((item) => (
                      <li
                        key={item}
                        className="rounded-full bg-cream-50/8 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.1em] text-cream-50/50"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="shell mt-8 flex items-center gap-5">
          <span className="eyebrow text-[0.54rem] text-cream-50/35">01</span>
          <div className="relative h-px flex-1 bg-cream-50/15">
            <span
              ref={progressRef}
              className="absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-lime-300"
            />
          </div>
          <span className="eyebrow text-[0.54rem] text-cream-50/35">05</span>
        </div>
      </div>
    </section>
  )
}
