import { Footer } from '../components/layout/Footer'
import { Nav } from '../components/layout/Nav'
import { ScrollProgress } from '../components/layout/ScrollProgress'
import { SmoothScroll } from '../components/layout/SmoothScroll'
import { Cycle } from '../components/sections/Cycle'
import { Findings } from '../components/sections/Findings'
import { Hero } from '../components/sections/Hero'
import { Impact } from '../components/sections/Impact'
import { Lenses } from '../components/sections/Lenses'
import { Manifesto } from '../components/sections/Manifesto'
import { Method } from '../components/sections/Method'
import { Variables } from '../components/sections/Variables'
import { Cursor } from '../components/ui/Cursor'

export function Landing() {
  return (
    <>
      <a
        href="#overview"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cream-50 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-forest-950"
      >
        Skip to content
      </a>

      <SmoothScroll />
      <ScrollProgress />
      <Cursor />
      <div className="grain" aria-hidden="true" />

      <Nav />

      <main>
        <Hero />
        <Manifesto />
        <div className="h-20 bg-gradient-to-b from-cream-100 to-forest-950 md:h-28" aria-hidden="true" />
        <Impact />
        <div className="h-20 bg-gradient-to-b from-forest-950 to-cream-50 md:h-28" aria-hidden="true" />
        <Lenses />
        <div className="h-16 bg-gradient-to-b from-cream-50 to-forest-950" aria-hidden="true" />
        <Variables />
        <Cycle />
        <div className="h-20 bg-gradient-to-b from-forest-950 to-cream-100 md:h-28" aria-hidden="true" />
        <Method />
        <Findings />
      </main>

      <Footer />
    </>
  )
}
