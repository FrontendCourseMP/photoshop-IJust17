import { useEffect, useMemo, useRef, useState } from 'react'
import type { ImageDocument } from '../image/imageTypes'
import {
  KERNEL_CHANNELS,
  KERNEL_PADDING_STRATEGIES,
  KERNEL_PRESETS,
  applyKernelFilterAsync,
  createDefaultKernelChannelSelection,
  isAbortError,
  type KernelChannelSelection,
  type KernelFilterSettings,
  type KernelPaddingStrategy,
  type KernelPresetKey,
  type KernelValues,
} from '../image/kernelUtils'

type KernelPresetSelectValue = KernelPresetKey | 'custom'

type KernelFilterDialogProps = {
  imageDocument: ImageDocument | null
  open: boolean
  onPreviewChange: (imageData: ImageData | null) => void
  onApply: (imageData: ImageData) => void
  onCancel: () => void
}

const DEFAULT_PRESET = KERNEL_PRESETS[0]

export function KernelFilterDialog({
  imageDocument,
  open,
  onPreviewChange,
  onApply,
  onCancel,
}: KernelFilterDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const applyControllerRef = useRef<AbortController | null>(null)
  const [selectedPreset, setSelectedPreset] =
    useState<KernelPresetSelectValue>(DEFAULT_PRESET.value)
  const [kernelInputs, setKernelInputs] = useState<string[]>(
    formatKernelValues(DEFAULT_PRESET.kernel),
  )
  const [channels, setChannels] = useState<KernelChannelSelection>(
    createDefaultKernelChannelSelection,
  )
  const [padding, setPadding] = useState<KernelPaddingStrategy>('copy')
  const [previewEnabled, setPreviewEnabled] = useState(true)
  const [isPreviewProcessing, setIsPreviewProcessing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [actionError, setActionError] = useState('')
  const parsedKernel = useMemo(
    () => parseKernelInputs(kernelInputs),
    [kernelInputs],
  )
  const validationError = getValidationError(parsedKernel, channels)
  const settings = useMemo<KernelFilterSettings | null>(() => {
    if (!parsedKernel || validationError) {
      return null
    }

    return {
      kernel: parsedKernel,
      channels,
      padding,
    }
  }, [channels, padding, parsedKernel, validationError])

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
      applyControllerRef.current?.abort()
    }
  }, [open])

  useEffect(() => {
    if (!open || !imageDocument) {
      return
    }

    resetState()
    onPreviewChange(null)
  }, [imageDocument, open, onPreviewChange])

  useEffect(() => {
    if (!open || !imageDocument) {
      return
    }

    if (!previewEnabled || !settings) {
      setIsPreviewProcessing(false)
      setProgress(0)
      onPreviewChange(null)
      return
    }

    const controller = new AbortController()
    let isCurrent = true

    setIsPreviewProcessing(true)
    setProgress(0)

    applyKernelFilterAsync(imageDocument.imageData, settings, {
      signal: controller.signal,
      onProgress: setProgress,
    })
      .then((nextImageData) => {
        if (isCurrent) {
          onPreviewChange(nextImageData)
          setIsPreviewProcessing(false)
        }
      })
      .catch((error) => {
        if (!isCurrent || isAbortError(error)) {
          return
        }

        setActionError('Не удалось построить предпросмотр фильтра.')
        onPreviewChange(null)
        setIsPreviewProcessing(false)
      })

    return () => {
      isCurrent = false
      controller.abort()
    }
  }, [imageDocument, onPreviewChange, open, previewEnabled, settings])

  if (!imageDocument) {
    return null
  }

  function resetState() {
    setSelectedPreset(DEFAULT_PRESET.value)
    setKernelInputs(formatKernelValues(DEFAULT_PRESET.kernel))
    setChannels(createDefaultKernelChannelSelection())
    setPadding('copy')
    setPreviewEnabled(true)
    setIsPreviewProcessing(false)
    setIsApplying(false)
    setProgress(0)
    setActionError('')
  }

  function handleClose() {
    applyControllerRef.current?.abort()
    onPreviewChange(null)
    onCancel()
  }

  function handleReset() {
    resetState()
    onPreviewChange(null)
  }

  function handlePresetChange(value: KernelPresetSelectValue) {
    const preset = KERNEL_PRESETS.find((item) => item.value === value)

    if (!preset) {
      setSelectedPreset(value)
      return
    }

    setSelectedPreset(preset.value)
    setKernelInputs(formatKernelValues(preset.kernel))
    setActionError('')
  }

  function handleKernelInputChange(index: number, value: string) {
    setSelectedPreset('custom')
    setKernelInputs((currentInputs) =>
      currentInputs.map((currentValue, currentIndex) =>
        currentIndex === index ? value : currentValue,
      ),
    )
    setActionError('')
  }

  function handleChannelChange(channel: keyof KernelChannelSelection) {
    setChannels((currentChannels) => ({
      ...currentChannels,
      [channel]: !currentChannels[channel],
    }))
    setActionError('')
  }

  async function handleApply() {
    if (!settings || !imageDocument) {
      return
    }

    setIsApplying(true)
    setActionError('')
    setProgress(0)

    const controller = new AbortController()

    applyControllerRef.current = controller

    try {
      const nextImageData = await applyKernelFilterAsync(
        imageDocument.imageData,
        settings,
        {
          signal: controller.signal,
          onProgress: setProgress,
        },
      )

      onPreviewChange(null)
      onApply(nextImageData)
    } catch (error) {
      if (!isAbortError(error)) {
        setActionError('Не удалось применить фильтр.')
      }
    } finally {
      if (applyControllerRef.current === controller) {
        applyControllerRef.current = null
      }
      setIsApplying(false)
    }
  }

  const visibleError = validationError || actionError
  const processingText = isApplying
    ? 'Применение фильтра...'
    : 'Пересчет предпросмотра...'

  return (
    <dialog
      className="kernel-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        handleClose()
      }}
    >
      <div className="levels-header">
        <h2>Фильтрация</h2>
        <button className="icon-button" type="button" onClick={handleClose}>
          Закрыть
        </button>
      </div>

      <div className="kernel-content">
        <div className="kernel-row">
          <label className="kernel-field">
            Пресет
            <select
              className="select"
              value={selectedPreset}
              onChange={(event) =>
                handlePresetChange(event.target.value as KernelPresetSelectValue)
              }
              disabled={isApplying}
            >
              {KERNEL_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
              {selectedPreset === 'custom' && (
                <option value="custom">Свое ядро</option>
              )}
            </select>
          </label>

          <label className="kernel-field">
            Край
            <select
              className="select"
              value={padding}
              onChange={(event) => {
                setPadding(event.target.value as KernelPaddingStrategy)
                setActionError('')
              }}
              disabled={isApplying}
            >
              {KERNEL_PADDING_STRATEGIES.map((strategy) => (
                <option key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={previewEnabled}
              disabled={isApplying}
              onChange={(event) => setPreviewEnabled(event.target.checked)}
            />
            Предпросмотр
          </label>
        </div>

        <section className="kernel-section" aria-label="Матрица ядра">
          <h3>Ядро 3x3</h3>
          <div className="kernel-grid">
            {kernelInputs.map((value, index) => (
              <input
                key={index}
                className="number-input kernel-input"
                type="number"
                step="0.001"
                value={value}
                disabled={isApplying}
                aria-label={`Коэффициент ${index + 1}`}
                onChange={(event) =>
                  handleKernelInputChange(index, event.target.value)
                }
              />
            ))}
          </div>
        </section>

        <section className="kernel-section" aria-label="Каналы фильтрации">
          <h3>Каналы</h3>
          <div className="kernel-channel-list">
            {KERNEL_CHANNELS.map((channel) => (
              <label className="checkbox-label" key={channel.value}>
                <input
                  type="checkbox"
                  checked={channels[channel.value]}
                  disabled={isApplying}
                  onChange={() => handleChannelChange(channel.value)}
                />
                {channel.label}
              </label>
            ))}
          </div>
        </section>

        {(isPreviewProcessing || isApplying) && (
          <p className="dialog-hint">
            {processingText} {Math.round(progress * 100)}%
          </p>
        )}

        {visibleError && <p className="dialog-error">{visibleError}</p>}
      </div>

      <div className="levels-actions">
        <button
          className="button"
          type="button"
          disabled={isApplying}
          onClick={handleClose}
        >
          Закрыть
        </button>
        <button
          className="button"
          type="button"
          disabled={isApplying}
          onClick={handleReset}
        >
          Сбросить
        </button>
        <button
          className="button button-active"
          type="button"
          disabled={!settings || isApplying}
          onClick={handleApply}
        >
          {isApplying ? 'Применение...' : 'Применить'}
        </button>
      </div>
    </dialog>
  )
}

function formatKernelValues(values: KernelValues) {
  return values.map((value) => Number(value.toFixed(6)).toString())
}

function parseKernelInputs(inputs: string[]): KernelValues | null {
  if (inputs.length !== 9) {
    return null
  }

  const values = inputs.map((value) => Number(value))

  if (values.some((value) => !Number.isFinite(value))) {
    return null
  }

  return values as KernelValues
}

function getValidationError(
  kernel: KernelValues | null,
  channels: KernelChannelSelection,
) {
  if (!kernel) {
    return 'Введите корректные числовые коэффициенты ядра.'
  }

  if (!Object.values(channels).some(Boolean)) {
    return 'Выберите хотя бы один канал.'
  }

  return ''
}
