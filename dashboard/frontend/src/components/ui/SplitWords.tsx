import { motion } from 'motion/react'
import { Fragment } from 'react'

type Props = {
  lines: readonly string[]
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div'
  className?: string
  emphasis?: readonly string[]
  emphasisClassName?: string
  delay?: number
  once?: boolean
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.06 },
  },
}

const word = {
  hidden: { y: '115%', opacity: 0 },
  show: {
    y: '0%',
    opacity: 1,
    transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function SplitWords({
  lines,
  as: Tag = 'h2',
  className,
  emphasis = [],
  emphasisClassName = 'text-lime-300',
  delay = 0,
  once = true,
}: Props) {
  const normalized = emphasis.map((entry) => entry.toLowerCase())

  return (
    <Tag className={className}>
      <motion.span
        className="block"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once, margin: '-8% 0px -8% 0px' }}
        transition={{ delayChildren: delay }}
      >
        {lines.map((line, lineIndex) => {
          const words = line.split(' ')
          return (
            <span key={lineIndex} className="block">
              {words.map((text, wordIndex) => {
                const clean = text.replace(/[^\w'-]/g, '').toLowerCase()
                const isEmphasis = normalized.includes(clean)

                return (
                  <Fragment key={`${lineIndex}-${wordIndex}`}>
                    <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
                      <motion.span
                        variants={word}
                        className={`inline-block ${isEmphasis ? emphasisClassName : ''}`}
                      >
                        {text}
                      </motion.span>
                    </span>
                    {wordIndex < words.length - 1 ? ' ' : null}
                  </Fragment>
                )
              })}
            </span>
          )
        })}
      </motion.span>
    </Tag>
  )
}
