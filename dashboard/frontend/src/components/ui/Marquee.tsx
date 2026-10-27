type Props = {
  items: readonly string[]
  className?: string
  separator?: string
}

export function Marquee({ items, className = '', separator = '·' }: Props) {
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="flex shrink-0 items-center gap-8 whitespace-nowrap">
          <span>{item}</span>
          <span className="text-lime-300/70">{separator}</span>
        </span>
      ))}
    </div>
  )

  return (
    <div className={`group relative flex overflow-hidden ${className}`}>
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {row}
        <div aria-hidden="true" className="flex">
          {row}
        </div>
      </div>
    </div>
  )
}
