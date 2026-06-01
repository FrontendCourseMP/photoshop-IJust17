type ToolbarProps = {
  onFileChange: (file: File | null) => void
  isLoading: boolean
}

export function Toolbar({ onFileChange, isLoading }: ToolbarProps) {
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
          disabled={isLoading}
          onChange={(event) => {
            onFileChange(event.target.files?.[0] ?? null)
            event.currentTarget.value = ''
          }}
        />
      </div>

      <div className="toolbar-group">
        <label className="field-label" htmlFor="export-format">
          Экспорт
        </label>
        <select
          className="select"
          id="export-format"
          defaultValue="png"
          disabled
        >
          <option value="png">PNG</option>
          <option value="jpeg">JPG</option>
          <option value="gb7">GB7</option>
        </select>
        <button className="button" type="button" disabled>
          Скачать
        </button>
      </div>
    </section>
  )
}
