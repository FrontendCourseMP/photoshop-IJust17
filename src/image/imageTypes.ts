export type ImageFormat = 'png' | 'jpeg' | 'gb7' | 'unknown'

export type ImageDocument = {
  imageData: ImageData
  width: number
  height: number
  fileName: string
  format: ImageFormat
  colorDepth: string
}
