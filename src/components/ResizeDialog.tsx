import { useEffect, useMemo, useRef, useState } from 'react'
import {
  INTERPOLATION_METHODS,
  getInterpolationInfo,
  resizeImageData,
  type InterpolationMethod,
} from '../image/scaleUtils'
import type { ImageDocument } from '../image/imageTypes'

type ResizeUnit = 'percent' | 'pixels'

type ResizeDialogProps = {
  imageDocument: ImageDocument | null
  open: boolean
  onApply: (imageData: ImageData) => void
  onCancel: () => void
}

export function ResizeDialog({
  imageDocument,
  open,
  onApply,
  onCancel,
}: ResizeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [unit, setUnit] = useState<ResizeUnit>('percent')
  const [widthValue, setWidthValue] = useState(100)
  const [heightValue, setHeightValue] = useState(100)
  const [keepAspect, setKeepAspect] = useState(true)
  const [method, setMethod] = useState<InterpolationMethod>('bilinear')
  const [errorMessage, setErrorMessage] = useState('')
  const targetSize = useMemo(() => {
    if (!imageDocument) {
      return { width: 0, height: 0 }
    }

    if (unit === 'percent') {
      return {
        width: Math.round((imageDocument.width * widthValue) / 100),
        height: Math.round((imageDocument.height * heightValue) / 100),
      }
    }

    return {
      width: Math.round(widthValue),
      height: Math.round(heightValue),
    }
  }, [heightValue, imageDocument, unit, widthValue])
  const interpolationInfo = getInterpolationInfo(method)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    if (!open || !imageDocument) {
      return
    }

    setUnit('percent')
    setWidthValue(100)
    setHeightValue(100)
    setKeepAspect(true)
    setMethod('bilinear')
    setErrorMessage('')
  }, [imageDocument, open])

  if (!imageDocument) {
    return null
  }

  const currentImageDocument = imageDocument

  function handleUnitChange(nextUnit: ResizeUnit) {
    if (nextUnit === unit) {
      return
    }

    if (nextUnit === 'percent') {
      setWidthValue(Math.round((targetSize.width / currentImageDocument.width) * 100))
      setHeightValue(
        Math.round((targetSize.height / currentImageDocument.height) * 100),
      )
    } else {
      setWidthValue(targetSize.width)
      setHeightValue(targetSize.height)
    }

    setUnit(nextUnit)
    setErrorMessage('')
  }

  function handleWidthChange(value: number) {
    const nextWidth = normalizeValue(value)

    setWidthValue(nextWidth)

    if (keepAspect) {
      setHeightValue(getLinkedHeight(nextWidth))
    }
  }

  function handleHeightChange(value: number) {
    const nextHeight = normalizeValue(value)

    setHeightValue(nextHeight)

    if (keepAspect) {
      setWidthValue(getLinkedWidth(nextHeight))
    }
  }

  function handleApply() {
    const validationError = validateTargetSize(targetSize.width, targetSize.height)

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    onApply(
      resizeImageData(
        currentImageDocument.imageData,
        targetSize.width,
        targetSize.height,
        method,
      ),
    )
  }

  function getLinkedHeight(width: number) {
    if (unit === 'percent') {
      return width
    }

    return Math.max(
      1,
      Math.round(width / (currentImageDocument.width / currentImageDocument.height)),
    )
  }

  function getLinkedWidth(height: number) {
    if (unit === 'percent') {
      return height
    }

    return Math.max(
      1,
      Math.round(
        height * (currentImageDocument.width / currentImageDocument.height),
      ),
    )
  }

  return (
    <dialog
      className="resize-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
    >
      <div className="levels-header">
        <h2>Размер изображения</h2>
        <button className="icon-button" type="button" onClick={onCancel}>
          Закрыть
        </button>
      </div>

      <div className="resize-summary">
        <span>
          До: {formatMegapixels(currentImageDocument.width, currentImageDocument.height)}
        </span>
        <span>После: {formatMegapixels(targetSize.width, targetSize.height)}</span>
      </div>

      <div className="resize-grid">
        <label>
          Значения
          <select
            className="select"
            value={unit}
            onChange={(event) => handleUnitChange(event.target.value as ResizeUnit)}
          >
            <option value="percent">Проценты</option>
            <option value="pixels">Пиксели</option>
          </select>
        </label>

        <label>
          Ширина
          <input
            className="number-input"
            type="number"
            min="1"
            max={unit === 'percent' ? 1000 : 10000}
            value={widthValue}
            onChange={(event) => handleWidthChange(Number(event.target.value))}
          />
        </label>

        <label>
          Высота
          <input
            className="number-input"
            type="number"
            min="1"
            max={unit === 'percent' ? 1000 : 10000}
            value={heightValue}
            onChange={(event) => handleHeightChange(Number(event.target.value))}
          />
        </label>

        <label className="checkbox-label resize-checkbox">
          <input
            type="checkbox"
            checked={keepAspect}
            onChange={(event) => setKeepAspect(event.target.checked)}
          />
          Сохранять пропорции
        </label>

        <label>
          Интерполяция
          <span className="select-with-tooltip">
            <select
              className="select"
              value={method}
              onChange={(event) =>
                setMethod(event.target.value as InterpolationMethod)
              }
            >
              {INTERPOLATION_METHODS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <span className="tooltip" title={interpolationInfo?.description}>
              ?
            </span>
          </span>
        </label>
      </div>

      {errorMessage && <p className="dialog-error">{errorMessage}</p>}

      <div className="levels-actions">
        <button className="button" type="button" onClick={onCancel}>
          Отмена
        </button>
        <button className="button button-active" type="button" onClick={handleApply}>
          Применить
        </button>
      </div>
    </dialog>
  )
}

function normalizeValue(value: number) {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.max(1, Math.round(value))
}

function validateTargetSize(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return 'Введите корректные числа.'
  }

  if (width < 1 || height < 1) {
    return 'Ширина и высота должны быть больше 0.'
  }

  if (width > 10000 || height > 10000) {
    return 'Максимальная ширина и высота: 10000 пикселей.'
  }

  if (width * height > 50000000) {
    return 'Слишком большое изображение. Уменьшите размер.'
  }

  return ''
}

function formatMegapixels(width: number, height: number) {
  const pixels = Math.max(0, width * height)

  return `${(pixels / 1000000).toFixed(2)} Мп (${width} x ${height})`
}
