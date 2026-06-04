import { useEffect, useRef, type MouseEvent } from 'react'
import { getPixelSample } from '../image/channelUtils'
import { clampDisplayScale } from '../image/scaleUtils'
import type { ImageDocument } from '../image/imageTypes'

type WorkspaceProps = {
  imageDocument: ImageDocument | null
  renderedImageData: ImageData | null
  displayedImageData: ImageData | null
  isPipetteActive: boolean
  autoScaleKey: number
  onAutoScale: (scale: number) => void
  onPixelPick: (sample: ReturnType<typeof getPixelSample>) => void
}

export function Workspace({
  imageDocument,
  renderedImageData,
  displayedImageData,
  isPipetteActive,
  autoScaleKey,
  onAutoScale,
  onPixelPick,
}: WorkspaceProps) {
  const workspaceRef = useRef<HTMLElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasWidth = renderedImageData?.width ?? 640
  const canvasHeight = renderedImageData?.height ?? 360
  const imageWidth = imageDocument?.width ?? 0
  const imageHeight = imageDocument?.height ?? 0

  useEffect(() => {
    const workspace = workspaceRef.current

    if (!workspace || imageWidth === 0 || imageHeight === 0 || autoScaleKey === 0) {
      return
    }

    const frameId = requestAnimationFrame(() => {
      const rect = workspace.getBoundingClientRect()
      const availableWidth = Math.max(1, rect.width - 100)
      const availableHeight = Math.max(1, rect.height - 100)
      const scale = Math.min(
        (availableWidth / imageWidth) * 100,
        (availableHeight / imageHeight) * 100,
      )

      onAutoScale(clampDisplayScale(scale))
    })

    return () => cancelAnimationFrame(frameId)
  }, [autoScaleKey, imageWidth, imageHeight, onAutoScale])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas || !renderedImageData) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    context.putImageData(renderedImageData, 0, 0)
  }, [renderedImageData])

  function handleCanvasClick(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current

    if (!canvas || !displayedImageData || !isPipetteActive) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const canvasX = Math.floor(
      ((event.clientX - rect.left) * canvas.width) / rect.width,
    )
    const canvasY = Math.floor(
      ((event.clientY - rect.top) * canvas.height) / rect.height,
    )
    const x = Math.floor((canvasX * displayedImageData.width) / canvas.width)
    const y = Math.floor((canvasY * displayedImageData.height) / canvas.height)

    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
      return
    }

    onPixelPick(getPixelSample(displayedImageData, x, y))
  }

  return (
    <main className="workspace" ref={workspaceRef}>
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
