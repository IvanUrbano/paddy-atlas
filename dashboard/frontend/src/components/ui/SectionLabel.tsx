type Props = {
  index: string
  label: string
  className?: string
}

export function SectionLabel({ index, label, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-3.5 eyebrow ${className}`}>
      <span className="h-px w-9 bg-current opacity-30" />
      <span className="opacity-50">{index}</span>
      <span>{label}</span>
    </div>
  )
}
