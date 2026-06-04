export type InterpolationMethod = 'nearest' | 'bilinear'

export type InterpolationInfo = {
  value: InterpolationMethod
  label: string
  description: string
}

export const INTERPOLATION_METHODS: InterpolationInfo[] = [
  {
    value: 'nearest',
    label: 'Ближайший сосед',
    description: 'Быстрый метод без сглаживания. Хорош для пиксельной графики.',
  },
  {
    value: 'bilinear',
    label: 'Билинейная',
    description: 'Сглаживает переходы и обычно лучше подходит для фотографий.',
  },
]

export function resizeImageData(
  source: ImageData,
  width: number,
  height: number,
  method: InterpolationMethod,
) {
  const targetWidth = clampDimension(width)
  const targetHeight = clampDimension(height)

  if (method === 'nearest') {
    return resizeNearest(source, targetWidth, targetHeight)
  }

  return resizeBilinear(source, targetWidth, targetHeight)
}

export function getInterpolationInfo(method: InterpolationMethod) {
  return INTERPOLATION_METHODS.find((item) => item.value === method)
}

export function clampDisplayScale(value: number) {
  return Math.min(300, Math.max(12, Math.round(value)))
}

function resizeNearest(source: ImageData, width: number, height: number) {
  const result = new ImageData(width, height)
  const xRatio = source.width / width
  const yRatio = source.height / height

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(source.height - 1, Math.floor((y + 0.5) * yRatio))

    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(source.width - 1, Math.floor((x + 0.5) * xRatio))

      copyPixel(source, result, sourceX, sourceY, x, y)
    }
  }

  return result
}

function resizeBilinear(source: ImageData, width: number, height: number) {
  const result = new ImageData(width, height)
  const xRatio = source.width / width
  const yRatio = source.height / height

  for (let y = 0; y < height; y += 1) {
    const sourceY = (y + 0.5) * yRatio - 0.5
    const y0 = clampIndex(Math.floor(sourceY), source.height)
    const y1 = clampIndex(y0 + 1, source.height)
    const yWeight = sourceY - Math.floor(sourceY)

    for (let x = 0; x < width; x += 1) {
      const sourceX = (x + 0.5) * xRatio - 0.5
      const x0 = clampIndex(Math.floor(sourceX), source.width)
      const x1 = clampIndex(x0 + 1, source.width)
      const xWeight = sourceX - Math.floor(sourceX)
      const targetIndex = (y * width + x) * 4

      for (let channel = 0; channel < 4; channel += 1) {
        const topLeft = getPixelValue(source, x0, y0, channel)
        const topRight = getPixelValue(source, x1, y0, channel)
        const bottomLeft = getPixelValue(source, x0, y1, channel)
        const bottomRight = getPixelValue(source, x1, y1, channel)
        const top = topLeft + (topRight - topLeft) * xWeight
        const bottom = bottomLeft + (bottomRight - bottomLeft) * xWeight

        result.data[targetIndex + channel] = Math.round(
          top + (bottom - top) * yWeight,
        )
      }
    }
  }

  return result
}

function copyPixel(
  source: ImageData,
  target: ImageData,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
) {
  const sourceIndex = (sourceY * source.width + sourceX) * 4
  const targetIndex = (targetY * target.width + targetX) * 4

  target.data[targetIndex] = source.data[sourceIndex]
  target.data[targetIndex + 1] = source.data[sourceIndex + 1]
  target.data[targetIndex + 2] = source.data[sourceIndex + 2]
  target.data[targetIndex + 3] = source.data[sourceIndex + 3]
}

function getPixelValue(
  source: ImageData,
  x: number,
  y: number,
  channel: number,
) {
  return source.data[(y * source.width + x) * 4 + channel]
}

function clampIndex(value: number, size: number) {
  return Math.min(size - 1, Math.max(0, value))
}

function clampDimension(value: number) {
  return Math.min(10000, Math.max(1, Math.round(value)))
}
