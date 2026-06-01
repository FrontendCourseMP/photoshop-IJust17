import type { ExportFormat, ImageDocument } from '../image/imageTypes'
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

export function exportBrowserImage(
  imageData: ImageData,
  format: ExportFormat,
): Promise<Blob> {
  if (format !== 'png' && format !== 'jpeg') {
    throw new Error('Браузерный экспорт поддерживает только PNG и JPG.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Не удалось подготовить canvas для экспорта.')
  }

  if (format === 'jpeg') {
    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = imageData.width
    sourceCanvas.height = imageData.height

    const sourceContext = sourceCanvas.getContext('2d')

    if (!sourceContext) {
      throw new Error('Не удалось подготовить изображение для JPG.')
    }

    sourceContext.putImageData(imageData, 0, 0)
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(sourceCanvas, 0, 0)
  } else {
    context.putImageData(imageData, 0, 0)
  }

  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Не удалось подготовить файл для скачивания.'))
          return
        }

        resolve(blob)
      },
      mimeType,
      0.92,
    )
  })
}
