import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { nav } from '../../content/site'
import { getLenis, scrollToId } from '../../lib/scroll'
import { Logo } from './Logo'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40)
  })

  useEffect(() => {
    const lenis = getLenis()
    if (open) {
      lenis?.stop()
      document.body.style.overflow = 'hidden'
    } else {
      lenis?.start()
      document.body.style.overflow = ''
    }
    return () => {
      lenis?.start()
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const previous = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusables = () =>
      [
        toggleRef.current,
        ...(panel?.querySelectorAll<HTMLElement>('button, a[href], input') ?? []),
      ].filter((item): item is HTMLElement => Boolean(item))

    const frame = requestAnimationFrame(() => focusables()[1]?.focus())

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [open])

  const go = (id: string) => {
    setOpen(false)
    window.setTimeout(() => scrollToId(id), open ? 380 : 0)
  }

  const dark = scrolled && !open

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 transition-all duration-500 ${
          open
            ? 'z-[70] border-b border-transparent bg-transparent py-5'
            : scrolled
              ? 'z-[55] border-b border-forest-900/10 bg-cream-100/85 py-3 backdrop-blur-xl'
              : 'z-[55] border-b border-transparent py-5'
        }`}
      >
        <div className="shell flex items-center justify-between">
          <button
            type="button"
            onClick={() => go('top')}
            className={`transition-colors duration-500 ${dark ? 'text-forest-900' : 'text-cream-50'}`}
            aria-label="Paddy Atlas home"
          >
            <Logo />
          </button>

          <nav className="hidden items-center gap-9 lg:flex">
            {nav.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => go(item.href)}
                className={`group relative text-[0.8rem] font-medium tracking-[0.02em] transition-colors duration-500 ${
                  dark ? 'text-forest-900/70 hover:text-forest-900' : 'text-cream-50/75 hover:text-cream-50'
                }`}
                data-cursor="hover"
              >
                {item.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-500 ease-out group-hover:scale-x-100" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {!open && (
              <Link
                to="/dashboard"
                className={`hidden rounded-full px-5 py-2.5 text-[0.76rem] font-semibold transition-colors duration-500 md:inline-flex ${
                  dark
                    ? 'bg-forest-900 text-cream-50 hover:bg-forest-800'
                    : 'bg-cream-50/95 text-forest-950 hover:bg-white'
                }`}
                data-cursor="hover"
              >
                Open dashboard
              </Link>
            )}

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="site-menu"
              className={`relative z-[70] flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full border transition-colors duration-500 lg:hidden ${
                dark
                  ? 'border-forest-900/20 text-forest-900'
                  : 'border-cream-50/30 text-cream-50'
              }`}
            >
              <motion.span
                animate={open ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
                className="block h-[1.5px] w-4 bg-current"
              />
              <motion.span
                animate={open ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
                className="block h-[1.5px] w-4 bg-current"
              />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[60] flex flex-col bg-forest-950 text-cream-50 lg:hidden"
          >
            <div className="shell flex flex-1 flex-col justify-center gap-2 pt-24 pb-10">
              {nav.map((item, index) => (
                <motion.button
                  key={item.href}
                  type="button"
                  onClick={() => go(item.href)}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-baseline justify-between border-b border-cream-50/10 py-4 text-left"
                >
                  <span className="font-display text-4xl font-medium tracking-tight">{item.label}</span>
                  <span className="eyebrow text-cream-50/40">0{index + 1}</span>
                </motion.button>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.5 }}
                className="mt-8 flex flex-col gap-4 text-sm text-cream-50/60"
              >
                <p>
                  ITC C307 · Foundation of Business Analytics
                  <br />
                  Group 9.2 — Tekiko &amp; Urbano
                </p>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-fit rounded-full bg-lime-300 px-6 py-3 text-[0.8rem] font-semibold text-forest-950"
                >
                  Open dashboard
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
