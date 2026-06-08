export interface SizePreset {
  label: string
  w: number
  h: number
}

export interface PlatformPreset {
  id: string
  name: string
  sizes: SizePreset[]
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: 'appstore',
    name: 'App Store',
    sizes: [
      { label: 'iPhone 6.7"', w: 1290, h: 2796 },
      { label: 'iPhone 6.5"', w: 1242, h: 2688 },
      { label: 'iPhone 5.5"', w: 1242, h: 2208 },
      { label: 'iPad 12.9"', w: 2048, h: 2732 },
      { label: 'iPad 11"', w: 1668, h: 2388 },
    ],
  },
  {
    id: 'googleplay',
    name: 'Google Play',
    sizes: [
      { label: 'Phone', w: 1080, h: 1920 },
      { label: '7" Tablet', w: 1200, h: 1920 },
      { label: '10" Tablet', w: 1920, h: 1200 },
      { label: 'Feature graphic', w: 1024, h: 500 },
    ],
  },
  {
    id: 'steam',
    name: 'Steam',
    sizes: [
      { label: 'Screenshot', w: 1920, h: 1080 },
      { label: 'Library hero', w: 3840, h: 1240 },
      { label: 'Library capsule', w: 600, h: 900 },
      { label: 'Store capsule', w: 460, h: 215 },
    ],
  },
  {
    id: 'producthunt',
    name: 'Product Hunt',
    sizes: [
      { label: 'Gallery', w: 1270, h: 760 },
      { label: 'Thumbnail', w: 240, h: 240 },
    ],
  },
]
