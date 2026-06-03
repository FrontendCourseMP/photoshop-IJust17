import { useEffect, useRef } from 'react'
import {
  CHANNELS,
  createChannelPreview,
} from '../image/channelUtils'
import type {
  ChannelKey,
  ChannelVisibility,
  ImageDocument,
  PixelSample,
} from '../image/imageTypes'

type ChannelPanelProps = {
  imageDocument: ImageDocument | null
  channelVisibility: ChannelVisibility
  pixelSample: PixelSample | null
  onToggleChannel: (channel: ChannelKey) => void
}

type ChannelPreviewProps = {
  imageData: ImageData | null
  channel: ChannelKey
}

export function ChannelPanel({
  imageDocument,
  channelVisibility,
  pixelSample,
  onToggleChannel,
}: ChannelPanelProps) {
  return (
    <aside className="channel-panel">
      <section className="panel-section">
        <h2>Каналы</h2>
        <div className="channel-list">
          {CHANNELS.map((channel) => {
            const isActive = channelVisibility[channel.key]

            return (
              <button
                className={`channel-button ${isActive ? 'channel-button-active' : ''}`}
                type="button"
                key={channel.key}
                disabled={!imageDocument}
                aria-pressed={isActive}
                onClick={() => onToggleChannel(channel.key)}
              >
                <ChannelPreview
                  imageData={imageDocument?.imageData ?? null}
                  channel={channel.key}
                />
                <span className="channel-text">
                  <span>
                    {channel.shortName} · {channel.name}
                  </span>
                  <span>{isActive ? 'Включен' : 'Выключен'}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel-section">
        <h2>Пипетка</h2>
        {pixelSample ? (
          <div className="pixel-info">
            <span>
              X: {pixelSample.x}, Y: {pixelSample.y}
            </span>
            <span>
              RGB: {pixelSample.r}, {pixelSample.g}, {pixelSample.b}
            </span>
            <span>A: {pixelSample.a}</span>
            <span>
              CIELAB: L {pixelSample.lab.l}, a {pixelSample.lab.a}, b{' '}
              {pixelSample.lab.b}
            </span>
          </div>
        ) : (
          <p className="panel-note">Выберите пипетку и кликните по изображению.</p>
        )}
      </section>
    </aside>
  )
}

function ChannelPreview({ imageData, channel }: ChannelPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas || !imageData) {
      return
    }

    const preview = createChannelPreview(imageData, channel)
    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    canvas.width = preview.width
    canvas.height = preview.height
    context.putImageData(preview, 0, 0)
  }, [imageData, channel])

  return (
    <canvas
      ref={canvasRef}
      className="channel-preview"
      width="120"
      height="80"
      aria-hidden="true"
    />
  )
}
