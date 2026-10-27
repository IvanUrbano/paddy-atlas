import { lenses } from '../../content/site'
import { Img } from '../ui/Img'
import { Reveal } from '../ui/Reveal'
import { SectionLabel } from '../ui/SectionLabel'
import { SplitWords } from '../ui/SplitWords'

export function Lenses() {
  return (
    <section id="analysis" className="relative bg-cream-50 pb-24 pt-24 md:pb-32 md:pt-32">
      <div className="shell">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionLabel index="03" label="Analysis" className="text-forest-900/55" />
            <SplitWords
              as="h2"
              lines={['Three stages', 'of analysis.']}
              emphasis={['analysis.']}
              emphasisClassName="text-leaf-600"
              className="display-xl mt-8 text-forest-900"
            />
          </div>
          <Reveal delay={0.15} className="max-w-sm lg:pb-2">
            <p className="text-sm leading-relaxed text-forest-900/55">
              Descriptive and diagnostic stages are available now. Predictive modelling is planned;
              this release makes no out-of-sample performance claim.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3 md:gap-5">
          {lenses.map((lens, index) => (
            <Reveal key={lens.title} delay={index * 0.09}>
              <article
                className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-forest-900/10 bg-cream-100/70 transition-all duration-700 hover:-translate-y-1.5 hover:border-forest-900/20 hover:shadow-[0_30px_60px_-30px_rgba(4,22,15,0.28)]"
                data-cursor="hover"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Img
                    name={lens.image}
                    className="h-full w-full"
                    imgClassName="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950/55 via-forest-950/5 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full border border-cream-50/25 bg-forest-950/25 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-cream-50 backdrop-blur-md">
                    {lens.index}
                  </span>
                  <span
                    className={`absolute bottom-5 right-5 rounded-full px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.18em] ${
                      lens.status === 'Available'
                        ? 'bg-lime-300 text-forest-950'
                        : 'bg-sand-300 text-forest-900'
                    }`}
                  >
                    {lens.status}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6 md:p-7">
                  <h3 className="font-display text-3xl font-medium tracking-tight text-forest-900">
                    {lens.title}
                  </h3>
                  <p className="mt-1.5 text-xs uppercase tracking-[0.14em] text-forest-900/40">
                    {lens.question}
                  </p>
                  <p className="mt-5 text-sm leading-relaxed text-forest-900/65">{lens.body}</p>

                  <ul className="mt-auto space-y-2.5 border-t border-forest-900/10 pt-6 text-[0.78rem] text-forest-900/60">
                    {lens.points.map((point) => (
                      <li key={point} className="flex items-center gap-2.5">
                        <span className="h-1 w-1 rounded-full bg-leaf-600" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
