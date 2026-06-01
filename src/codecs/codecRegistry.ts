import { exportBrowserImage, loadBrowserImage } from './browserCodec'
import { encodeGb7, loadGb7Image } from './gb7Codec'
import type { ExportFormat, ImageDocument } from '../image/imageTypes'
import { getImageFormat } from '../image/imageUtils'

export async function loadImageFile(file: File): Promise<ImageDocument> {
  const format = getImageFormat(file)

  if (format === 'png' || format === 'jpeg') {
    return loadBrowserImage(file)
  }

  if (format === 'gb7') {
    return loadGb7Image(file)
  }

  throw new Error('Поддерживаются только файлы PNG, JPG/JPEG и GB7.')
}

export function exportImageFile(
  imageDocument: ImageDocument,
  format: ExportFormat,
): Promise<Blob> {
  if (format === 'png' || format === 'jpeg') {
    return exportBrowserImage(imageDocument.imageData, format)
  }

  const bytes = encodeGb7(imageDocument.imageData)
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  const blob = new Blob([buffer], { type: 'application/octet-stream' })

  return Promise.resolve(blob)
}
