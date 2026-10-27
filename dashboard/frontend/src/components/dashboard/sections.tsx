import { useEffect, useRef, useState, type MouseEvent } from 'react'

const DASHBOARD_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'central-tendency', label: 'Central tendency' },
  { id: 'dispersion', label: 'Dispersion' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'interpretation', label: 'Interpretation' },
  { id: 'method', label: 'Data & method' },
] as const

export function DashboardNav() {
  const [active, setActive] = useState<string>(() => {
    const requested = window.location.hash.slice(1)
    return DASHBOARD_SECTIONS.some((section) => section.id === requested)
      ? requested
      : DASHBOARD_SECTIONS[0].id
  })
  const [progress, setProgress] = useState(0)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const requested = window.location.hash.slice(1)
    if (!DASHBOARD_SECTIONS.some((section) => section.id === requested)) return
    document.getElementById(requested)?.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, [])

  useEffect(() => {
    const bar = navRef.current
    const link = bar?.querySelector<HTMLElement>(`a[href="#${active}"]`)
    if (!bar || !link) return

    const barBox = bar.getBoundingClientRect()
    const linkBox = link.getBoundingClientRect()
    if (linkBox.left >= barBox.left && linkBox.right <= barBox.right) return

    bar.scrollTo({
      left: bar.scrollLeft + linkBox.left - barBox.left - 16,
      behavior: 'smooth',
    })
  }, [active])

  useEffect(() => {
    const update = () => {
      const marker = 168
      let current: string = DASHBOARD_SECTIONS[0].id

      for (const section of DASHBOARD_SECTIONS) {
        const node = document.getElementById(section.id)
        if (node && node.getBoundingClientRect().top <= marker) current = section.id
      }

      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8
      if (atBottom) current = DASHBOARD_SECTIONS[DASHBOARD_SECTIONS.length - 1].id

      setActive(current)

      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const jump = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    const node = document.getElementById(id)
    if (!node) return
    node.scrollIntoView({ behavior: 'instant', block: 'start' })
    window.history.replaceState(null, '', `#${id}`)
    setActive(id)
  }

  return (
    <div className="relative sticky top-16 z-40 border-b border-cream-50/10 bg-forest-950/95 text-cream-50 shadow-[0_14px_34px_-22px_rgba(4,22,15,0.9)] backdrop-blur-xl">
      <nav
        ref={navRef}
        aria-label="Dashboard sections"
        className="shell hide-scrollbar flex items-center gap-1 overflow-x-auto py-3"
      >
        <span className="mr-2 hidden shrink-0 items-center gap-2 lg:flex">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-lime-300" />
          <span className="eyebrow text-[0.48rem] text-lime-300/75">Sections</span>
        </span>
        <span aria-hidden="true" className="mr-2 hidden h-5 w-px bg-cream-50/15 lg:block" />
        {DASHBOARD_SECTIONS.map((section, index) => {
          const selected = active === section.id
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(event) => jump(event, section.id)}
              aria-current={selected ? 'location' : undefined}
              className={`group shrink-0 rounded-full px-3.5 py-2 text-[0.72rem] font-semibold tracking-[-0.01em] transition-all duration-200 ${
                selected
                  ? 'bg-lime-300 text-forest-950 shadow-[0_4px_16px_rgba(207,233,139,0.22)]'
                  : 'text-cream-50/65 hover:bg-cream-50/10 hover:text-cream-50'
              }`}
            >
              <span
                className={`mr-1.5 text-[0.52rem] tabular-nums ${
                  selected
                    ? 'text-forest-900/55'
                    : 'text-cream-50/30 group-hover:text-cream-50/55'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              {section.label}
            </a>
          )
        })}
      </nav>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] bg-cream-50/10">
        <div
          className="h-full bg-lime-300/80 transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function SectionHeading({
  index,
  kicker,
  title,
  description,
}: {
  index: string
  kicker: string
  title: string
  description: string
}) {
  return (
    <div className="mb-7 grid gap-4 border-t border-forest-900/12 pt-7 md:grid-cols-[1.1fr_0.9fr] md:items-end">
      <div>
        <p className="flex items-center gap-2 eyebrow text-[0.55rem] text-forest-900/40">
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-forest-950 px-1.5 text-[0.5rem] font-semibold tabular-nums tracking-normal text-lime-300">
            {index}
          </span>
          {kicker}
        </p>
        <h2 className="mt-2 font-display text-[clamp(1.8rem,3.4vw,2.75rem)] font-medium leading-[1.02] tracking-[-0.035em] text-forest-950">
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-[0.78rem] leading-relaxed text-forest-900/55 md:justify-self-end">
        {description}
      </p>
    </div>
  )
}
