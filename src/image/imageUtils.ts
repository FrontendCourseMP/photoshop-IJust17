import type { ImageFormat } from './imageTypes'

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

  return 'unknown'
}

export function getColorDepth(imageData: ImageData, format: ImageFormat) {
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
