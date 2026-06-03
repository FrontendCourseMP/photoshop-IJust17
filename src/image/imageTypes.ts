export type ImageFormat = 'png' | 'jpeg' | 'gb7' | 'unknown'
export type ExportFormat = 'png' | 'jpeg' | 'gb7'
export type ChannelKey = 'red' | 'green' | 'blue' | 'alpha'
export type ChannelVisibility = Record<ChannelKey, boolean>

export type LabColor = {
  l: number
  a: number
  b: number
}

export type PixelSample = {
  x: number
  y: number
  r: number
  g: number
  b: number
  a: number
  lab: LabColor
}

export type ImageDocument = {
  imageData: ImageData
  width: number
  height: number
  fileName: string
  format: ImageFormat
  colorDepth: string
}
