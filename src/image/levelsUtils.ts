import type { ChannelKey } from './imageTypes'

export type LevelsChannel = 'master' | ChannelKey
export type HistogramMode = 'linear' | 'log'

export type LevelsInput = {
  blackPoint: number
  whitePoint: number
  gamma: number
}

export type LevelsSettings = Record<LevelsChannel, LevelsInput>

export const LEVELS_CHANNELS: { value: LevelsChannel; label: string }[] = [
  { value: 'master', label: 'Master' },
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'alpha', label: 'Alpha' },
]

export function createDefaultLevelsSettings(): LevelsSettings {
  return {
    master: createDefaultLevelsInput(),
    red: createDefaultLevelsInput(),
    green: createDefaultLevelsInput(),
    blue: createDefaultLevelsInput(),
    alpha: createDefaultLevelsInput(),
  }
}

export function applyLevels(
  source: ImageData,
  settings: LevelsSettings,
) {
  const result = new ImageData(source.width, source.height)
  const sourceData = source.data
  const resultData = result.data
  const masterLut = createLevelsLut(settings.master)
  const redLut = createLevelsLut(settings.red)
  const greenLut = createLevelsLut(settings.green)
  const blueLut = createLevelsLut(settings.blue)
  const alphaLut = createLevelsLut(settings.alpha)

  for (let index = 0; index < sourceData.length; index += 4) {
    resultData[index] = redLut[masterLut[sourceData[index]]]
    resultData[index + 1] = greenLut[masterLut[sourceData[index + 1]]]
    resultData[index + 2] = blueLut[masterLut[sourceData[index + 2]]]
    resultData[index + 3] = alphaLut[sourceData[index + 3]]
  }

  return result
}

export function buildHistogram(source: ImageData, channel: LevelsChannel) {
  const histogram = new Array<number>(256).fill(0)
  const data = source.data

  for (let index = 0; index < data.length; index += 4) {
    const value =
      channel === 'master'
        ? Math.round(0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2])
        : data[index + getChannelOffset(channel)]

    histogram[value] += 1
  }

  return histogram
}

export function getMidpoint(settings: LevelsInput) {
  const range = settings.whitePoint - settings.blackPoint
  const midpoint = settings.blackPoint + range * 0.5 ** settings.gamma

  return clamp(Math.round(midpoint), settings.blackPoint + 1, settings.whitePoint - 1)
}

export function getGammaFromMidpoint(
  midpoint: number,
  blackPoint: number,
  whitePoint: number,
) {
  const normalized = clamp(
    (midpoint - blackPoint) / (whitePoint - blackPoint),
    0.01,
    0.99,
  )
  const gamma = Math.log(normalized) / Math.log(0.5)

  return clamp(Math.round(gamma * 100) / 100, 0.1, 9.9)
}

export function clampLevelsInput(input: LevelsInput): LevelsInput {
  const blackPoint = clamp(Math.round(input.blackPoint), 0, 253)
  const whitePoint = clamp(Math.round(input.whitePoint), blackPoint + 2, 255)
  const gamma = clamp(Math.round(input.gamma * 100) / 100, 0.1, 9.9)

  return {
    blackPoint,
    whitePoint,
    gamma,
  }
}

function createDefaultLevelsInput(): LevelsInput {
  return {
    blackPoint: 0,
    whitePoint: 255,
    gamma: 1,
  }
}

function createLevelsLut(input: LevelsInput) {
  const settings = clampLevelsInput(input)
  const lut = new Uint8ClampedArray(256)
  const range = settings.whitePoint - settings.blackPoint

  for (let value = 0; value < lut.length; value += 1) {
    if (value <= settings.blackPoint) {
      lut[value] = 0
    } else if (value >= settings.whitePoint) {
      lut[value] = 255
    } else {
      const normalized = (value - settings.blackPoint) / range
      lut[value] = Math.round(255 * normalized ** (1 / settings.gamma))
    }
  }

  return lut
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
