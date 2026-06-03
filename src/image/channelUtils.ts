import { rgbToLab } from './colorUtils'
import type {
  ChannelKey,
  ChannelVisibility,
  PixelSample,
} from './imageTypes'

export type ChannelInfo = {
  key: ChannelKey
  name: string
  shortName: string
}

export const CHANNELS: ChannelInfo[] = [
  { key: 'red', name: 'Красный', shortName: 'R' },
  { key: 'green', name: 'Зелёный', shortName: 'G' },
  { key: 'blue', name: 'Синий', shortName: 'B' },
  { key: 'alpha', name: 'Альфа', shortName: 'A' },
]

export function createDefaultChannelVisibility(): ChannelVisibility {
  return {
    red: true,
    green: true,
    blue: true,
    alpha: true,
  }
}

export function applyChannelVisibility(
  source: ImageData,
  visibility: ChannelVisibility,
) {
  const result = new ImageData(source.width, source.height)
  const sourceData = source.data
  const resultData = result.data
  const alphaOnly =
    !visibility.red &&
    !visibility.green &&
    !visibility.blue &&
    visibility.alpha

  for (let index = 0; index < sourceData.length; index += 4) {
    const red = sourceData[index]
    const green = sourceData[index + 1]
    const blue = sourceData[index + 2]
    const alpha = sourceData[index + 3]

    if (alphaOnly) {
      resultData[index] = alpha
      resultData[index + 1] = alpha
      resultData[index + 2] = alpha
      resultData[index + 3] = 255
    } else {
      resultData[index] = visibility.red ? red : 0
      resultData[index + 1] = visibility.green ? green : 0
      resultData[index + 2] = visibility.blue ? blue : 0
      resultData[index + 3] = visibility.alpha ? alpha : 255
    }
  }

  return result
}

export function createChannelPreview(
  source: ImageData,
  channel: ChannelKey,
  maxWidth = 120,
  maxHeight = 80,
) {
  const scale = Math.min(maxWidth / source.width, maxHeight / source.height, 1)
  const width = Math.max(1, Math.round(source.width * scale))
  const height = Math.max(1, Math.round(source.height * scale))
  const preview = new ImageData(width, height)
  const channelOffset = getChannelOffset(channel)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(source.width - 1, Math.floor(x / scale))
      const sourceY = Math.min(source.height - 1, Math.floor(y / scale))
      const sourceIndex = (sourceY * source.width + sourceX) * 4
      const targetIndex = (y * width + x) * 4
      const value = source.data[sourceIndex + channelOffset]

      preview.data[targetIndex] = value
      preview.data[targetIndex + 1] = value
      preview.data[targetIndex + 2] = value
      preview.data[targetIndex + 3] = 255
    }
  }

  return preview
}

export function getPixelSample(imageData: ImageData, x: number, y: number) {
  const index = (y * imageData.width + x) * 4
  const r = imageData.data[index]
  const g = imageData.data[index + 1]
  const b = imageData.data[index + 2]
  const a = imageData.data[index + 3]

  return {
    x,
    y,
    r,
    g,
    b,
    a,
    lab: rgbToLab(r, g, b),
  } satisfies PixelSample
}

function getChannelOffset(channel: ChannelKey) {
  if (channel === 'red') {
    return 0
  }

  if (channel === 'green') {
    return 1
  }

  if (channel === 'blue') {
    return 2
  }

  return 3
}
