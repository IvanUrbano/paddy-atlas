import { Link } from 'react-router-dom'
import { footerLinks } from '../../content/site'
import { scrollToId, scrollToTop } from '../../lib/scroll'
import { Logo } from './Logo'

const year = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forest-950 pt-20 text-cream-50">
      <div className="shell">
        <div className="grid gap-12 pb-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="flex items-center gap-3">
              <Logo
                className="text-lime-300"
                iconClassName="h-8 w-8"
                wordClassName="text-[0.875rem] text-cream-50"
              />
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream-50/50">
              A business-analytics case study on paddy productivity — built on the UCI Paddy Dataset
              and a reproducible Python pipeline.
            </p>
            <p className="mt-6 text-[0.62rem] uppercase tracking-[0.18em] text-cream-50/30">
              ITC C307 · Foundation of Business Analytics · Group 9.2
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-6">
            <div>
              <p className="eyebrow text-[0.55rem] text-cream-50/35">Explore</p>
              <ul className="mt-4 space-y-2.5">
                {footerLinks.explore.map((link) => (
                  <li key={link.href}>
                    <button
                      type="button"
                      onClick={() => scrollToId(link.href)}
                      className="text-sm text-cream-50/60 transition-colors duration-300 hover:text-lime-300"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="eyebrow text-[0.55rem] text-cream-50/35">Project</p>
              <ul className="mt-4 space-y-2.5">
                {footerLinks.project.map((link) => (
                  <li key={link.href}>
                    <button
                      type="button"
                      onClick={() => scrollToId(link.href)}
                      className="text-sm text-cream-50/60 transition-colors duration-300 hover:text-lime-300"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
                <li>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-cream-50/60 transition-colors duration-300 hover:text-lime-300"
                  >
                    Data dashboard
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
                      <path
                        d="M2.5 6h7M6 2.5 9.5 6 6 9.5"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
                <li>
                  <a
                    href="https://doi.org/10.24432/C55W3J"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-cream-50/60 transition-colors duration-300 hover:text-lime-300"
                  >
                    Dataset DOI
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
                      <path d="M3 9 9 3M9 3H4.5M9 3v4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="select-none border-t border-cream-50/8 pt-8">
          <p className="font-display text-[clamp(2.5rem,12.5vw,11rem)] font-semibold leading-[0.8] tracking-[-0.05em] text-cream-50/[0.06]">
            PADDY ATLAS
          </p>
        </div>

        <div className="flex flex-col gap-4 border-t border-cream-50/8 py-7 text-[0.6rem] uppercase tracking-[0.14em] text-cream-50/30 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Paddy Atlas · Tekiko &amp; Urbano</p>
          <p>
            Data: UCI Paddy Dataset (CC BY 4.0) · Photography: Pexels
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 text-cream-50/50 transition-colors duration-300 hover:text-lime-300"
            data-cursor="hover"
          >
            Back to top
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
              <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  )
}
