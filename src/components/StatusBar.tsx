import type { ImageDocument, PixelSample } from '../image/imageTypes'

type StatusBarProps = {
  imageDocument: ImageDocument | null
  errorMessage: string
  isLoading: boolean
  isExporting: boolean
  isPipetteActive: boolean
  isLevelsOpen: boolean
  displayScalePercent: number
  pixelSample: PixelSample | null
}

export function StatusBar({
  imageDocument,
  errorMessage,
  isLoading,
  isExporting,
  isPipetteActive,
  isLevelsOpen,
  displayScalePercent,
  pixelSample,
}: StatusBarProps) {
  const fileName = imageDocument?.fileName ?? 'не выбран'
  const format = imageDocument?.format.toUpperCase() ?? '-'
  const size = imageDocument
    ? `${imageDocument.width} x ${imageDocument.height}`
    : '-'
  const colorDepth = imageDocument?.colorDepth ?? '-'

  return (
    <footer className="status-bar">
      <span>Файл: {fileName}</span>
      <span>Формат: {format}</span>
      <span>Размер: {size}</span>
      <span>Глубина цвета: {colorDepth}</span>
      <span>Масштаб: {displayScalePercent}%</span>
      {isPipetteActive && <span>Пипетка: активна</span>}
      {isLevelsOpen && <span>Уровни: открыты</span>}
      {pixelSample && (
        <span>
          Пиксель: X {pixelSample.x}, Y {pixelSample.y}
        </span>
      )}
      {isLoading && <span className="status-info">Загрузка...</span>}
      {isExporting && <span className="status-info">Сохранение...</span>}
      {errorMessage && <span className="status-error">{errorMessage}</span>}
    </footer>
  )
}
