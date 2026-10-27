import { imageMeta, type ImageName } from '../../content/images'

type Props = {
  name: ImageName
  alt?: string
  className?: string
  imgClassName?: string
  sizes?: string
  priority?: boolean
}

export function Img({ name, alt, className, imgClassName, sizes = '100vw', priority }: Props) {
  const meta = imageMeta[name]

  return (
    <div className={className}>
      <img
        src={`/images/${name}-1600.jpg`}
        srcSet={`/images/${name}-800.jpg 800w, /images/${name}-1600.jpg 1600w`}
        sizes={sizes}
        width={meta.width}
        height={meta.height}
        alt={alt ?? meta.alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={imgClassName}
      />
    </div>
  )
}
