import type { ChannelKey } from './imageTypes'

export type KernelPaddingStrategy = 'black' | 'white' | 'copy'
export type KernelPresetKey =
  | 'identity'
  | 'sharpen'
  | 'gaussian'
  | 'boxBlur'
  | 'prewittHorizontal'
  | 'prewittVertical'
export type KernelValues = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]
export type KernelChannelSelection = Record<ChannelKey, boolean>

export type KernelFilterSettings = {
  kernel: KernelValues
  channels: KernelChannelSelection
  padding: KernelPaddingStrategy
}

type KernelFilterOptions = {
  signal?: AbortSignal
  onProgress?: (progress: number) => void
  yieldEveryRows?: number
}

const CHANNEL_OFFSETS: Record<ChannelKey, number> = {
  red: 0,
  green: 1,
  blue: 2,
  alpha: 3,
}

export const KERNEL_CHANNELS: Array<{ value: ChannelKey; label: string }> = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'alpha', label: 'Alpha' },
]

export const KERNEL_PADDING_STRATEGIES: Array<{
  value: KernelPaddingStrategy
  label: string
}> = [
  { value: 'copy', label: 'Копирование' },
  { value: 'black', label: 'Черный край' },
  { value: 'white', label: 'Белый край' },
]

export const KERNEL_PRESETS: Array<{
  value: KernelPresetKey
  label: string
  kernel: KernelValues
}> = [
  {
    value: 'identity',
    label: 'Тождественное отображение',
    kernel: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  },
  {
    value: 'sharpen',
    label: 'Повышение резкости',
    kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  },
  {
    value: 'gaussian',
    label: 'Фильтр Гаусса 3x3',
    kernel: [
      1 / 16,
      2 / 16,
      1 / 16,
      2 / 16,
      4 / 16,
      2 / 16,
      1 / 16,
      2 / 16,
      1 / 16,
    ],
  },
  {
    value: 'boxBlur',
    label: 'Прямоугольное размытие',
    kernel: [
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
      1 / 9,
    ],
  },
  {
    value: 'prewittHorizontal',
    label: 'Прюитт: горизонтальные границы',
    kernel: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
  },
  {
    value: 'prewittVertical',
    label: 'Прюитт: вертикальные границы',
    kernel: [-1, 0, 1, -1, 0, 1, -1, 0, 1],
  },
]

export function createDefaultKernelChannelSelection(): KernelChannelSelection {
  return {
    red: true,
    green: true,
    blue: true,
    alpha: false,
  }
}

export function createDefaultKernelSettings(): KernelFilterSettings {
  return {
    kernel: [...KERNEL_PRESETS[0].kernel] as KernelValues,
    channels: createDefaultKernelChannelSelection(),
    padding: 'copy',
  }
}

export async function applyKernelFilterAsync(
  imageData: ImageData,
  settings: KernelFilterSettings,
  options: KernelFilterOptions = {},
) {
  throwIfAborted(options.signal)

  const { width, height, data } = imageData
  const output = new Uint8ClampedArray(data)
  const selectedOffsets = KERNEL_CHANNELS.filter(
    (channel) => settings.channels[channel.value],
  ).map((channel) => CHANNEL_OFFSETS[channel.value])

  if (selectedOffsets.length === 0) {
    return new ImageData(output, width, height)
  }

  const yieldEveryRows =
    options.yieldEveryRows ?? Math.max(4, Math.floor(650000 / Math.max(width, 1)))

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const targetIndex = (y * width + x) * 4

      for (const channelOffset of selectedOffsets) {
        let value = 0

        for (let kernelY = 0; kernelY < 3; kernelY += 1) {
          for (let kernelX = 0; kernelX < 3; kernelX += 1) {
            const sourceX = x + kernelX - 1
            const sourceY = y + kernelY - 1
            const kernelIndex = kernelY * 3 + kernelX

            value +=
              settings.kernel[kernelIndex] *
              readPaddedChannel(
                data,
                width,
                height,
                sourceX,
                sourceY,
                channelOffset,
                settings.padding,
              )
          }
        }

        output[targetIndex + channelOffset] = clampByte(value)
      }
    }

    if (y % yieldEveryRows === 0) {
      options.onProgress?.(y / Math.max(height - 1, 1))
      throwIfAborted(options.signal)
      await yieldToBrowser()
    }
  }

  options.onProgress?.(1)
  throwIfAborted(options.signal)

  return new ImageData(output, width, height)
}

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

function readPaddedChannel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channelOffset: number,
  padding: KernelPaddingStrategy,
) {
  if (x >= 0 && y >= 0 && x < width && y < height) {
    return data[(y * width + x) * 4 + channelOffset]
  }

  if (padding === 'black') {
    return 0
  }

  if (padding === 'white') {
    return 255
  }

  const copiedX = clampInt(x, 0, width - 1)
  const copiedY = clampInt(y, 0, height - 1)

  return data[(copiedY * width + copiedX) * 4 + channelOffset]
}

function clampByte(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(255, Math.max(0, Math.round(value)))
}

function clampInt(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) {
    return
  }

  const error = new Error('Operation aborted')

  error.name = 'AbortError'
  throw error
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve())
      return
    }

    setTimeout(resolve, 0)
  })
}
