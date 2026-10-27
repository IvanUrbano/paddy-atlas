export function Logo({
  className = '',
  iconClassName = 'h-7 w-7',
  wordClassName = '',
}: {
  className?: string
  iconClassName?: string
  wordClassName?: string
}) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 32 32" className={iconClassName} aria-hidden="true" fill="none">
        <path d="M16 28.5V13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M16 17.5C9.6 17.5 6.5 14.4 6.5 8c6.4 0 9.5 3.1 9.5 9.5Z" fill="currentColor" />
        <path
          d="M16 22c6.4 0 9.5-3.1 9.5-9.5-6.4 0-9.5 3.1-9.5 9.5Z"
          fill="currentColor"
          opacity="0.55"
        />
      </svg>
      <span
        className={`font-display text-[0.82rem] font-semibold uppercase tracking-[0.2em] ${wordClassName}`}
      >
        Paddy Atlas
      </span>
    </span>
  )
}
