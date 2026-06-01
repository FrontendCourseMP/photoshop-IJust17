import type { ImageDocument } from '../image/imageTypes'

const HEADER_SIZE = 12
const VERSION = 0x01
const MASK_FLAG = 0x01
const RESERVED_FLAGS = 0xfe
const MASK_BIT = 0x80
const GRAY_MASK = 0x7f
const SIGNATURE = [0x47, 0x42, 0x37, 0x1d]

export function decodeGb7(buffer: ArrayBuffer, fileName: string): ImageDocument {
  const bytes = new Uint8Array(buffer)

  checkHeader(bytes)

  const flags = bytes[5]
  const hasMask = (flags & MASK_FLAG) === MASK_FLAG
  const width = readUint16(bytes, 6)
  const height = readUint16(bytes, 8)
  const expectedSize = HEADER_SIZE + width * height

  if (bytes.length !== expectedSize) {
    throw new Error('Размер данных GB7 не совпадает с шириной и высотой.')
  }

  const imageData = new ImageData(width, height)

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const sourceValue = bytes[HEADER_SIZE + pixelIndex]
    const gray7 = sourceValue & GRAY_MASK
    const gray = Math.round((gray7 * 255) / 127)
    const targetIndex = pixelIndex * 4

    imageData.data[targetIndex] = gray
    imageData.data[targetIndex + 1] = gray
    imageData.data[targetIndex + 2] = gray
    imageData.data[targetIndex + 3] =
      !hasMask || (sourceValue & MASK_BIT) === MASK_BIT ? 255 : 0
  }

  return {
    imageData,
    width,
    height,
    fileName,
    format: 'gb7',
    colorDepth: hasMask ? '7 бит grayscale + mask' : '7 бит grayscale',
  }
}

export function encodeGb7(imageData: ImageData): Uint8Array {
  if (imageData.width <= 0 || imageData.height <= 0) {
    throw new Error('GB7 нельзя сохранить: изображение пустое.')
  }

  if (imageData.width > 65535 || imageData.height > 65535) {
    throw new Error('GB7 поддерживает ширину и высоту не больше 65535.')
  }

  const pixelCount = imageData.width * imageData.height
  const result = new Uint8Array(HEADER_SIZE + pixelCount)
  const hasMask = hasTransparentPixels(imageData)

  result.set(SIGNATURE, 0)
  result[4] = VERSION
  result[5] = hasMask ? MASK_FLAG : 0
  writeUint16(result, 6, imageData.width)
  writeUint16(result, 8, imageData.height)
  result[10] = 0
  result[11] = 0

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const sourceIndex = pixelIndex * 4
    const r = imageData.data[sourceIndex]
    const g = imageData.data[sourceIndex + 1]
    const b = imageData.data[sourceIndex + 2]
    const a = imageData.data[sourceIndex + 3]
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    const gray7 = Math.round((gray * 127) / 255)
    const maskValue = hasMask && a >= 128 ? MASK_BIT : 0

    result[HEADER_SIZE + pixelIndex] = gray7 | maskValue
  }

  return result
}

export async function loadGb7Image(file: File): Promise<ImageDocument> {
  const buffer = await file.arrayBuffer()

  return decodeGb7(buffer, file.name)
}

function checkHeader(bytes: Uint8Array) {
  if (bytes.length < HEADER_SIZE) {
    throw new Error('Файл GB7 слишком короткий.')
  }

  for (let index = 0; index < SIGNATURE.length; index += 1) {
    if (bytes[index] !== SIGNATURE[index]) {
      throw new Error('Неверная сигнатура GB7-файла.')
    }
  }

  if (bytes[4] !== VERSION) {
    throw new Error('Неподдерживаемая версия GB7-файла.')
  }

  if ((bytes[5] & RESERVED_FLAGS) !== 0) {
    throw new Error('В GB7-файле установлены зарезервированные flags.')
  }

  const width = readUint16(bytes, 6)
  const height = readUint16(bytes, 8)

  if (width === 0 || height === 0) {
    throw new Error('GB7-файл содержит нулевую ширину или высоту.')
  }

  if (readUint16(bytes, 10) !== 0) {
    throw new Error('Зарезервированное поле GB7 должно быть равно 0.')
  }
}

function hasTransparentPixels(imageData: ImageData) {
  for (let index = 3; index < imageData.data.length; index += 4) {
    if (imageData.data[index] < 128) {
      return true
    }
  }

  return false
}

function readUint16(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function writeUint16(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = (value >> 8) & 0xff
  bytes[offset + 1] = value & 0xff
}
