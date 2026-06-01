export function Workspace() {
  return (
    <main className="workspace">
      <div className="canvas-wrapper">
        <canvas
          className="image-canvas"
          width="640"
          height="360"
          aria-label="Рабочая область изображения"
        >
          Canvas не поддерживается этим браузером.
        </canvas>
      </div>
    </main>
  )
}
