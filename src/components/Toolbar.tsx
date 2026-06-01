export function Toolbar() {
  return (
    <section className="toolbar" aria-label="Панель инструментов">
      <div className="toolbar-group">
        <label className="field-label" htmlFor="image-file">
          Файл
        </label>
        <input
          className="file-input"
          id="image-file"
          type="file"
          accept=".png,.jpg,.jpeg,.gb7,image/png,image/jpeg"
          disabled
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
