import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'

export function Cursor() {
  const [enabled] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(pointer: coarse)').matches,
  )
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)

  const dotX = useSpring(x, { stiffness: 900, damping: 55, mass: 0.25 })
  const dotY = useSpring(y, { stiffness: 900, damping: 55, mass: 0.25 })
  const ringX = useSpring(x, { stiffness: 240, damping: 28, mass: 0.5 })
  const ringY = useSpring(y, { stiffness: 240, damping: 28, mass: 0.5 })

  useEffect(() => {
    if (!enabled) return

    document.body.classList.add('has-custom-cursor')

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
      setVisible(true)
    }

    const onOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      setHovering(Boolean(target?.closest('a, button, [data-cursor]')))
    }

    const onLeave = () => setVisible(false)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('mouseover', onOver)
    document.addEventListener('mouseleave', onLeave)

    return () => {
      document.body.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-90 hidden lg:block">
      <motion.div
        className="absolute -ml-1 -mt-1 h-2 w-2 rounded-full bg-cream-50 mix-blend-difference"
        style={{ x: dotX, y: dotY }}
        animate={{ opacity: visible && !hovering ? 1 : 0, scale: hovering ? 0 : 1 }}
        transition={{ duration: 0.25 }}
      />
      <motion.div
        className="absolute -ml-5 -mt-5 h-10 w-10 rounded-full border border-cream-50/80 mix-blend-difference"
        style={{ x: ringX, y: ringY }}
        animate={{ opacity: visible ? (hovering ? 1 : 0.45) : 0, scale: hovering ? 1.65 : 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}
