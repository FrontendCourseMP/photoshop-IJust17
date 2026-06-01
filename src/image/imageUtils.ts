import type { ExportFormat, ImageFormat } from './imageTypes'

export function getImageFormat(file: File): ImageFormat {
  const fileName = file.name.toLowerCase()

  if (file.type === 'image/png' || fileName.endsWith('.png')) {
    return 'png'
  }

  if (
    file.type === 'image/jpeg' ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg')
  ) {
    return 'jpeg'
  }

  if (fileName.endsWith('.gb7')) {
    return 'gb7'
  }

  return 'unknown'
}

export function getColorDepth(imageData: ImageData, format: ImageFormat) {
  if (format === 'gb7') {
    return '7 бит grayscale'
  }

  if (format === 'jpeg') {
    return '24 бит (RGB)'
  }

  for (let index = 3; index < imageData.data.length; index += 4) {
    if (imageData.data[index] < 255) {
      return '32 бита (RGBA)'
    }
  }

  return '24 бит (RGB)'
}

export function getExportFileName(fileName: string, format: ExportFormat) {
  const baseName = fileName.replace(/\.[^/.]+$/, '')
  const extension = format === 'jpeg' ? 'jpg' : format

  return `${baseName}.${extension}`
}
