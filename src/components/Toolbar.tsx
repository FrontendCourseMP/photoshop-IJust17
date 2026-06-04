import type { ExportFormat } from '../image/imageTypes'

type ToolbarProps = {
  exportFormat: ExportFormat
  canDownload: boolean
  onFileChange: (file: File | null) => void
  onExportFormatChange: (format: ExportFormat) => void
  onDownload: () => void
  onTogglePipette: () => void
  onOpenLevels: () => void
  onOpenResize: () => void
  isLoading: boolean
  isExporting: boolean
  isPipetteActive: boolean
  canOpenLevels: boolean
  canOpenResize: boolean
  canScale: boolean
  displayScalePercent: number
  onDisplayScaleChange: (scale: number) => void
}

export function Toolbar({
  exportFormat,
  canDownload,
  onFileChange,
  onExportFormatChange,
  onDownload,
  onTogglePipette,
  onOpenLevels,
  onOpenResize,
  isLoading,
  isExporting,
  isPipetteActive,
  canOpenLevels,
  canOpenResize,
  canScale,
  displayScalePercent,
  onDisplayScaleChange,
}: ToolbarProps) {
  const isBusy = isLoading || isExporting

  return (
    <section className="toolbar" aria-label="Панель инструментов">
      <div className="toolbar-group">
        <label className="field-label" htmlFor="image-file">
          Открыть
        </label>
        <input
          className="file-input"
          id="image-file"
          type="file"
          accept=".png,.jpg,.jpeg,.gb7,image/png,image/jpeg"
          disabled={isBusy}
          onChange={(event) => {
            onFileChange(event.target.files?.[0] ?? null)
            event.currentTarget.value = ''
          }}
        />
      </div>

      <div className="toolbar-group toolbar-scale">
        <label className="field-label" htmlFor="display-scale">
          Масштаб
        </label>
        <input
          className="scale-range"
          id="display-scale"
          type="range"
          min="12"
          max="300"
          value={displayScalePercent}
          disabled={!canScale || isBusy}
          onChange={(event) => onDisplayScaleChange(Number(event.target.value))}
        />
        <output>{displayScalePercent}%</output>
      </div>

      <div className="toolbar-group">
        <span className="field-label">Инструмент</span>
        <button
          className={`button ${isPipetteActive ? 'button-active' : ''}`}
          type="button"
          disabled={!canDownload || isBusy}
          onClick={onTogglePipette}
        >
          Пипетка
        </button>
      </div>

      <div className="toolbar-group">
        <span className="field-label">Коррекция</span>
        <button
          className="button"
          type="button"
          disabled={!canOpenLevels || isBusy}
          onClick={onOpenLevels}
        >
          Уровни
        </button>
        <button
          className="button"
          type="button"
          disabled={!canOpenResize || isBusy}
          onClick={onOpenResize}
        >
          Размер
        </button>
      </div>

      <div className="toolbar-group">
        <label className="field-label" htmlFor="export-format">
          Экспорт
        </label>
        <select
          className="select"
          id="export-format"
          value={exportFormat}
          disabled={!canDownload || isBusy}
          onChange={(event) =>
            onExportFormatChange(event.target.value as ExportFormat)
          }
        >
          <option value="png">PNG</option>
          <option value="jpeg">JPG</option>
          <option value="gb7">GB7</option>
        </select>
        <button
          className="button"
          type="button"
          disabled={!canDownload || isBusy}
          onClick={onDownload}
        >
          {isExporting ? 'Сохранение...' : 'Скачать'}
        </button>
      </div>
    </section>
  )
}
