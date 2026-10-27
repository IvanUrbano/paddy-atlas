import { motion, useReducedMotion, useSpring } from 'motion/react'
import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  children: ReactNode
  href?: string
  to?: string
  onClick?: () => void
  variant?: 'solid' | 'outline' | 'light'
  className?: string
  arrow?: boolean
  type?: 'button' | 'submit'
  ariaLabel?: string
}

const MotionLink = motion.create(Link)

const base =
  'group relative inline-flex items-center justify-center gap-3 rounded-full px-7 py-4 text-[0.82rem] font-semibold tracking-[0.02em] transition-colors duration-500'

const variants = {
  solid: 'bg-lime-300 text-forest-950 hover:bg-lime-200',
  outline: 'border border-current/30 text-current hover:border-current/60',
  light: 'bg-cream-50 text-forest-950 hover:bg-white',
}

export function MagneticButton({
  children,
  href,
  to,
  onClick,
  variant = 'solid',
  className = '',
  arrow = true,
  type = 'button',
  ariaLabel,
}: Props) {
  const reduce = useReducedMotion()
  const x = useSpring(0, { stiffness: 160, damping: 16, mass: 0.25 })
  const y = useSpring(0, { stiffness: 160, damping: 16, mass: 0.25 })

  const handleMove = (event: MouseEvent<HTMLElement>) => {
    if (reduce) return
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = (event.clientX - (rect.left + rect.width / 2)) * 0.28
    const offsetY = (event.clientY - (rect.top + rect.height / 2)) * 0.32
    x.set(Math.max(-14, Math.min(14, offsetX)))
    y.set(Math.max(-12, Math.min(12, offsetY)))
  }

  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }

  const content = (
    <>
      <span>{children}</span>
      {arrow && (
        <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-500 ease-out group-hover:translate-x-5 group-hover:-translate-y-5"
          >
            <path
              d="M4 16 16 4M16 4H7M16 4v9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            className="absolute h-4 w-4 -translate-x-5 translate-y-5 transition-transform duration-500 ease-out group-hover:translate-x-0 group-hover:translate-y-0"
          >
            <path
              d="M4 16 16 4M16 4H7M16 4v9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </>
  )

  const classes = `${base} ${variants[variant]} ${className}`

  if (href) {
    return (
      <motion.a
        href={href}
        aria-label={ariaLabel}
        className={classes}
        style={{ x, y }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={(event) => {
          if (onClick) {
            event.preventDefault()
            onClick()
          }
        }}
        data-cursor="hover"
      >
        {content}
      </motion.a>
    )
  }

  if (to) {
    return (
      <MotionLink
        to={to}
        aria-label={ariaLabel}
        className={classes}
        style={{ x, y }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        onClick={() => onClick?.()}
        data-cursor="hover"
      >
        {content}
      </MotionLink>
    )
  }

  return (
    <motion.button
      type={type}
      aria-label={ariaLabel}
      className={classes}
      style={{ x, y }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      data-cursor="hover"
    >
      {content}
    </motion.button>
  )
}
