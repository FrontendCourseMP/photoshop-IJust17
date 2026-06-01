import type { ImageDocument } from '../image/imageTypes'
import { getColorDepth, getImageFormat } from '../image/imageUtils'

export async function loadBrowserImage(file: File): Promise<ImageDocument> {
  const format = getImageFormat(file)

  if (format !== 'png' && format !== 'jpeg') {
    throw new Error('Сейчас поддерживается загрузка только PNG и JPG/JPEG.')
  }

  let bitmap: ImageBitmap

  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Не удалось прочитать изображение. Проверьте файл.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height

  const context = canvas.getContext('2d')

  if (!context) {
    bitmap.close()
    throw new Error('Не удалось подготовить canvas для изображения.')
  }

  context.drawImage(bitmap, 0, 0)
  const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height)
  bitmap.close()

  return {
    imageData,
    width: imageData.width,
    height: imageData.height,
    fileName: file.name,
    format,
    colorDepth: getColorDepth(imageData, format),
  }
}
