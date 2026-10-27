export const imageMeta = {
  hero: {
    width: 1600,
    height: 1067,
    alt: 'Lush green rice paddy fields stretching toward blue mountains',
  },
  sunset: {
    width: 1600,
    height: 1600,
    alt: 'Sunset over rice fields in Alappuzha with silhouetted workers',
  },
  field: {
    width: 1600,
    height: 2133,
    alt: 'Vibrant green rice field under a clear sky',
  },
  seedlings: {
    width: 1600,
    height: 2133,
    alt: 'Young rice seedling standing in a waterlogged paddy field',
  },
  planting: {
    width: 1600,
    height: 2400,
    alt: "A farmer's hand pressing rice seedlings into wet soil",
  },
  water: {
    width: 1600,
    height: 1067,
    alt: 'Young rice plants evenly spaced in a flooded paddy field',
  },
  terrace: {
    width: 1600,
    height: 1067,
    alt: 'Aerial view of terraced rice fields',
  },
  patchwork: {
    width: 1600,
    height: 1200,
    alt: 'Patchwork of green and brown rice fields with a small house',
  },
  farmer: {
    width: 1600,
    height: 1067,
    alt: 'Farmer tending crops in a terraced rice field',
  },
  grain: {
    width: 1600,
    height: 1067,
    alt: 'Close-up of harvested white rice grains',
  },
  closeup: {
    width: 1600,
    height: 1067,
    alt: 'Close-up of dense green rice plants',
  },
  valley: {
    width: 1600,
    height: 2133,
    alt: 'Paddy fields glowing at sunset beneath a hillside',
  },
} as const

export type ImageName = keyof typeof imageMeta
