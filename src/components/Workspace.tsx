import { useEffect, useRef, type MouseEvent } from 'react'
import { getPixelSample } from '../image/channelUtils'
import type { ImageDocument } from '../image/imageTypes'

type WorkspaceProps = {
  imageDocument: ImageDocument | null
  displayedImageData: ImageData | null
  isPipetteActive: boolean
  onPixelPick: (sample: ReturnType<typeof getPixelSample>) => void
}

export function Workspace({
  imageDocument,
  displayedImageData,
  isPipetteActive,
  onPixelPick,
}: WorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasWidth = displayedImageData?.width ?? 640
  const canvasHeight = displayedImageData?.height ?? 360

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas || !displayedImageData) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    context.putImageData(displayedImageData, 0, 0)
  }, [displayedImageData])

  function handleCanvasClick(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current

    if (!canvas || !displayedImageData || !isPipetteActive) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((event.clientX - rect.left) * canvas.width) / rect.width)
    const y = Math.floor(
      ((event.clientY - rect.top) * canvas.height) / rect.height,
    )

    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
      return
    }

    onPixelPick(getPixelSample(displayedImageData, x, y))
  }

  return (
    <main className="workspace">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className={`image-canvas ${isPipetteActive ? 'image-canvas-eyedropper' : ''}`}
          width={canvasWidth}
          height={canvasHeight}
          aria-label="Рабочая область изображения"
          onClick={handleCanvasClick}
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
