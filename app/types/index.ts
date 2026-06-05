export interface AuthUser {
  id: string
  email: string
}

export interface Project {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface SourceImage {
  id: string
  projectId: string
  label: string
  filename: string
  width: number
  height: number
  sortOrder: number
}

export type DeviceFrame = 'none' | 'phone' | 'browser' | 'laptop'

export interface Snip {
  id: string
  projectId: string
  sourceImageId: string
  label: string
  x: number
  y: number
  width: number
  height: number
  sortOrder: number
}

export type CompositionType = 'laptop' | 'laptop+phone' | 'auto' | 'freeform'
export type BackgroundType = 'solid' | 'gradient' | 'blur'

export interface BackgroundConfig {
  type: BackgroundType
  color: string
  gradientStart: string
  gradientEnd: string
  gradientAngle: number
  blurRegion?: { x: number; y: number; width: number; height: number }
}

export interface CaptionConfig {
  text: string
  size: number
  color: string
  position: 'top' | 'bottom'
  bgOpacity: number
}

// Per-slot config in free-form compositions
export interface FreeformSlotConfig {
  id: string
  snipId: string
  deviceFrame: DeviceFrame
  frameColor?: string
  // All in output canvas pixels. (x,y) = top-left corner of the total slot bounding box.
  x: number
  y: number
  width: number
  height: number
}

// Free-form composition: slots are z-ordered by array index (0 = back, last = front)
export interface FreeformCompositionConfig {
  slots: FreeformSlotConfig[]
  background: BackgroundConfig
  outputWidth: number
  outputHeight: number
}

// Auto-collage slot (no frame — frames distort justified layout)
export interface SnipSlotConfig {
  snipId: string
  caption?: CaptionConfig
}

export type CollageLayoutTemplate = 'auto'

export interface CollageCompositionConfig {
  slots: SnipSlotConfig[]
  template: CollageLayoutTemplate
  gap: number
  background: BackgroundConfig
  globalCaption?: CaptionConfig
  outputWidth: number
  outputHeight: number
}

export type CompositionConfig = FreeformCompositionConfig | CollageCompositionConfig

export interface Composition {
  id: string
  projectId: string
  name: string
  type: CompositionType
  config: CompositionConfig
  sortOrder: number
}

export function isFreeformConfig(c: CompositionConfig): c is FreeformCompositionConfig {
  return !('template' in c)
}

export function isCollageConfig(c: CompositionConfig): c is CollageCompositionConfig {
  return 'template' in c
}

export function isFreeformType(type: CompositionType): boolean {
  return type === 'freeform' || type === 'laptop' || type === 'laptop+phone'
}
