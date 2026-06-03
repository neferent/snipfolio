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

export interface ProjectSnapshot {
  id: string
  projectId: string
  filename: string
  width: number
  height: number
  storagePath: string
}

export type DeviceFrame = 'none' | 'phone' | 'browser' | 'laptop'

export interface Snip {
  id: string
  projectId: string
  label: string
  x: number
  y: number
  width: number
  height: number
  deviceFrame: DeviceFrame
  sortOrder: number
}

export type CompositionType = 'single' | 'collage'
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

export interface SnipSlotConfig {
  snipId: string
  deviceFrame: DeviceFrame
  caption?: CaptionConfig
  x?: number
  y?: number
  width?: number
  height?: number
}

export type CollageLayoutTemplate =
  | '2-horizontal'
  | '2-vertical'
  | '3-up'
  | '2x2'
  | '1+2-stacked'
  | 'free'

export interface SingleCompositionConfig {
  snipId: string
  deviceFrame: DeviceFrame
  background: BackgroundConfig
  scale: number
  offsetX: number
  offsetY: number
  caption?: CaptionConfig
  outputWidth: number
  outputHeight: number
}

export interface CollageCompositionConfig {
  slots: SnipSlotConfig[]
  template: CollageLayoutTemplate
  gap: number
  background: BackgroundConfig
  globalCaption?: CaptionConfig
  outputWidth: number
  outputHeight: number
}

export type CompositionConfig = SingleCompositionConfig | CollageCompositionConfig

export interface Composition {
  id: string
  projectId: string
  name: string
  type: CompositionType
  config: CompositionConfig
  sortOrder: number
}

export function isSingleConfig(c: CompositionConfig): c is SingleCompositionConfig {
  return 'snipId' in c && 'scale' in c
}

export function isCollageConfig(c: CompositionConfig): c is CollageCompositionConfig {
  return 'slots' in c
}
