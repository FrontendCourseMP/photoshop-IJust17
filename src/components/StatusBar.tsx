import type { ImageDocument } from '../image/imageTypes'

type StatusBarProps = {
  imageDocument: ImageDocument | null
}

export function StatusBar({ imageDocument }: StatusBarProps) {
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
    </footer>
  )
}
