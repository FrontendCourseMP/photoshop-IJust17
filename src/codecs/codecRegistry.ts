import { loadBrowserImage } from './browserCodec'
import { loadGb7Image } from './gb7Codec'
import type { ImageDocument } from '../image/imageTypes'
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
