import type { LabColor } from './imageTypes'

export function rgbToLab(red: number, green: number, blue: number): LabColor {
  const linearRed = srgbToLinear(red / 255)
  const linearGreen = srgbToLinear(green / 255)
  const linearBlue = srgbToLinear(blue / 255)

  const x = linearRed * 0.4124 + linearGreen * 0.3576 + linearBlue * 0.1805
  const y = linearRed * 0.2126 + linearGreen * 0.7152 + linearBlue * 0.0722
  const z = linearRed * 0.0193 + linearGreen * 0.1192 + linearBlue * 0.9505

  const labX = xyzToLab(x / 0.95047)
  const labY = xyzToLab(y)
  const labZ = xyzToLab(z / 1.08883)

  return {
    l: roundLab(116 * labY - 16),
    a: roundLab(500 * (labX - labY)),
    b: roundLab(200 * (labY - labZ)),
  }
}

function srgbToLinear(value: number) {
  if (value <= 0.04045) {
    return value / 12.92
  }

  return ((value + 0.055) / 1.055) ** 2.4
}

function xyzToLab(value: number) {
  if (value > 0.008856) {
    return Math.cbrt(value)
  }

  return 7.787 * value + 16 / 116
}

function roundLab(value: number) {
  return Math.round(value * 100) / 100
}
