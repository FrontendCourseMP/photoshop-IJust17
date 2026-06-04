import { useEffect, useRef, useState } from 'react'
import {
  LEVELS_CHANNELS,
  applyLevels,
  buildHistogram,
  clampLevelsInput,
  createDefaultLevelsSettings,
  getGammaFromMidpoint,
  getMidpoint,
  type HistogramMode,
  type LevelsChannel,
  type LevelsInput,
  type LevelsSettings,
} from '../image/levelsUtils'
import type { ImageDocument } from '../image/imageTypes'

type LevelsDialogProps = {
  imageDocument: ImageDocument | null
  open: boolean
  onPreviewChange: (imageData: ImageData | null) => void
  onApply: (imageData: ImageData) => void
  onCancel: () => void
}

type HistogramCanvasProps = {
  imageData: ImageData
  channel: LevelsChannel
  mode: HistogramMode
}

export function LevelsDialog({
  imageDocument,
  open,
  onPreviewChange,
  onApply,
  onCancel,
}: LevelsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<LevelsChannel>('master')
  const [histogramMode, setHistogramMode] = useState<HistogramMode>('linear')
  const [previewEnabled, setPreviewEnabled] = useState(true)
  const [settings, setSettings] = useState<LevelsSettings>(
    createDefaultLevelsSettings,
  )
  const selectedSettings = settings[selectedChannel]
  const midpoint = getMidpoint(selectedSettings)

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
    if (!open) {
      return
    }

    setSelectedChannel('master')
    setHistogramMode('linear')
    setPreviewEnabled(true)
    setSettings(createDefaultLevelsSettings())
    onPreviewChange(null)
  }, [open, imageDocument, onPreviewChange])

  useEffect(() => {
    if (!open || !imageDocument) {
      return
    }

    if (!previewEnabled) {
      onPreviewChange(null)
      return
    }

    const frameId = requestAnimationFrame(() => {
      onPreviewChange(applyLevels(imageDocument.imageData, settings))
    })

    return () => cancelAnimationFrame(frameId)
  }, [open, imageDocument, settings, previewEnabled, onPreviewChange])

  if (!imageDocument) {
    return null
  }

  function updateSelectedSettings(nextSettings: Partial<LevelsInput>) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [selectedChannel]: clampLevelsInput({
        ...currentSettings[selectedChannel],
        ...nextSettings,
      }),
    }))
  }

  function handleReset() {
    setSettings(createDefaultLevelsSettings())
    setPreviewEnabled(true)
  }

  function handleCancel() {
    onPreviewChange(null)
    onCancel()
  }

  function handleApply() {
    if (!imageDocument) {
      return
    }

    onApply(applyLevels(imageDocument.imageData, settings))
  }

  return (
    <dialog
      className="levels-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        handleCancel()
      }}
    >
      <div className="levels-header">
        <h2>Уровни</h2>
        <button className="icon-button" type="button" onClick={handleCancel}>
          Закрыть
        </button>
      </div>

      <div className="levels-row">
        <label className="field-label" htmlFor="levels-channel">
          Канал
        </label>
        <select
          className="select"
          id="levels-channel"
          value={selectedChannel}
          onChange={(event) =>
            setSelectedChannel(event.target.value as LevelsChannel)
          }
        >
          {LEVELS_CHANNELS.map((channel) => (
            <option key={channel.value} value={channel.value}>
              {channel.label}
            </option>
          ))}
        </select>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={previewEnabled}
            onChange={(event) => setPreviewEnabled(event.target.checked)}
          />
          Предпросмотр
        </label>
      </div>

      <div className="levels-row">
        <label className="field-label" htmlFor="histogram-mode">
          Гистограмма
        </label>
        <select
          className="select"
          id="histogram-mode"
          value={histogramMode}
          onChange={(event) =>
            setHistogramMode(event.target.value as HistogramMode)
          }
        >
          <option value="linear">Линейная</option>
          <option value="log">Логарифмическая</option>
        </select>
      </div>

      <HistogramCanvas
        imageData={imageDocument.imageData}
        channel={selectedChannel}
        mode={histogramMode}
      />

      <div className="levels-controls">
        <label>
          Чёрная точка
          <input
            type="range"
            min="0"
            max={selectedSettings.whitePoint - 2}
            value={selectedSettings.blackPoint}
            onChange={(event) =>
              updateSelectedSettings({ blackPoint: Number(event.target.value) })
            }
          />
          <span>{selectedSettings.blackPoint}</span>
        </label>

        <label>
          Полутона
          <input
            type="range"
            min={selectedSettings.blackPoint + 1}
            max={selectedSettings.whitePoint - 1}
            value={midpoint}
            onChange={(event) =>
              updateSelectedSettings({
                gamma: getGammaFromMidpoint(
                  Number(event.target.value),
                  selectedSettings.blackPoint,
                  selectedSettings.whitePoint,
                ),
              })
            }
          />
          <span>{selectedSettings.gamma.toFixed(2)}</span>
        </label>

        <label>
          Белая точка
          <input
            type="range"
            min={selectedSettings.blackPoint + 2}
            max="255"
            value={selectedSettings.whitePoint}
            onChange={(event) =>
              updateSelectedSettings({ whitePoint: Number(event.target.value) })
            }
          />
          <span>{selectedSettings.whitePoint}</span>
        </label>

        <label>
          Gamma
          <input
            className="number-input"
            type="number"
            min="0.1"
            max="9.9"
            step="0.1"
            value={selectedSettings.gamma}
            onChange={(event) =>
              updateSelectedSettings({ gamma: Number(event.target.value) })
            }
          />
        </label>
      </div>

      <div className="levels-actions">
        <button className="button" type="button" onClick={handleReset}>
          Сброс
        </button>
        <button className="button" type="button" onClick={handleCancel}>
          Отмена
        </button>
        <button className="button button-active" type="button" onClick={handleApply}>
          Применить
        </button>
      </div>
    </dialog>
  )
}

function HistogramCanvas({ imageData, channel, mode }: HistogramCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const histogram = buildHistogram(imageData, channel)
    const values = histogram.map((value) =>
      mode === 'log' ? Math.log1p(value) : value,
    )
    const maxValue = Math.max(...values, 1)

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#07100b'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#1f5135'
    context.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1)
    context.fillStyle = '#20b455'

    for (let index = 0; index < values.length; index += 1) {
      const barHeight = Math.round((values[index] / maxValue) * (canvas.height - 10))

      context.fillRect(index, canvas.height - barHeight - 5, 1, barHeight)
    }
  }, [imageData, channel, mode])

  return (
    <canvas
      className="histogram-canvas"
      ref={canvasRef}
      width="256"
      height="128"
      aria-label="Гистограмма изображения"
    />
  )
}
