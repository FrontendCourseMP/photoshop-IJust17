import { useEffect, useRef } from 'react'
import type { ImageDocument } from '../image/imageTypes'

type WorkspaceProps = {
  imageDocument: ImageDocument | null
}

export function Workspace({ imageDocument }: WorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasWidth = imageDocument?.width ?? 640
  const canvasHeight = imageDocument?.height ?? 360

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas || !imageDocument) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    context.putImageData(imageDocument.imageData, 0, 0)
  }, [imageDocument])

  return (
    <main className="workspace">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="image-canvas"
          width={canvasWidth}
          height={canvasHeight}
          aria-label="Рабочая область изображения"
        >
          Canvas не поддерживается этим браузером.
        </canvas>
        {!imageDocument && (
          <div className="canvas-placeholder">Изображение не загружено</div>
        )}
      </div>
    </main>
  )
}
