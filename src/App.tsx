import { useMemo, useState } from 'react'
import { ChannelPanel } from './components/ChannelPanel'
import { Header } from './components/Header'
import { LevelsDialog } from './components/LevelsDialog'
import { ResizeDialog } from './components/ResizeDialog'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { Workspace } from './components/Workspace'
import { exportImageFile, loadImageFile } from './codecs/codecRegistry'
import {
  applyChannelVisibility,
  createDefaultChannelVisibility,
} from './image/channelUtils'
import { getExportFileName } from './image/imageUtils'
import {
  clampDisplayScale,
  resizeImageData,
} from './image/scaleUtils'
import type {
  ChannelKey,
  ExportFormat,
  ImageDocument,
  PixelSample,
} from './image/imageTypes'
import './App.css'

function App() {
  const [imageDocument, setImageDocument] = useState<ImageDocument | null>(null)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [channelVisibility, setChannelVisibility] = useState(
    createDefaultChannelVisibility,
  )
  const [isPipetteActive, setIsPipetteActive] = useState(false)
  const [pixelSample, setPixelSample] = useState<PixelSample | null>(null)
  const [isLevelsOpen, setIsLevelsOpen] = useState(false)
  const [isResizeOpen, setIsResizeOpen] = useState(false)
  const [levelsPreviewImageData, setLevelsPreviewImageData] =
    useState<ImageData | null>(null)
  const [displayScalePercent, setDisplayScalePercent] = useState(100)
  const [imageVersion, setImageVersion] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const sourceImageData = levelsPreviewImageData ?? imageDocument?.imageData ?? null
  const displayedImageData = useMemo(() => {
    if (!sourceImageData) {
      return null
    }

    return applyChannelVisibility(sourceImageData, channelVisibility)
  }, [sourceImageData, channelVisibility])
  const scaledDisplayImageData = useMemo(() => {
    if (!displayedImageData) {
      return null
    }

    const scale = displayScalePercent / 100
    const width = Math.max(1, Math.round(displayedImageData.width * scale))
    const height = Math.max(1, Math.round(displayedImageData.height * scale))

    if (width === displayedImageData.width && height === displayedImageData.height) {
      return displayedImageData
    }

    return resizeImageData(displayedImageData, width, height, 'bilinear')
  }, [displayedImageData, displayScalePercent])

  async function handleFileChange(file: File | null) {
    if (!file) {
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const nextImageDocument = await loadImageFile(file)
      setImageDocument(nextImageDocument)
      setChannelVisibility(createDefaultChannelVisibility())
      setPixelSample(null)
      setLevelsPreviewImageData(null)
      setIsLevelsOpen(false)
      setIsResizeOpen(false)
      setDisplayScalePercent(100)
      setImageVersion((currentVersion) => currentVersion + 1)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось загрузить изображение.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDownload() {
    if (!imageDocument || !displayedImageData) {
      return
    }

    setIsExporting(true)
    setErrorMessage('')

    try {
      const exportDocument = {
        ...imageDocument,
        imageData: displayedImageData,
      }
      const blob = await exportImageFile(exportDocument, exportFormat)
      const fileName = getExportFileName(imageDocument.fileName, exportFormat)

      downloadBlob(blob, fileName)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Не удалось скачать изображение.'
      setErrorMessage(message)
    } finally {
      setIsExporting(false)
    }
  }

  function handleChannelToggle(channel: ChannelKey) {
    setChannelVisibility((currentVisibility) => ({
      ...currentVisibility,
      [channel]: !currentVisibility[channel],
    }))
    setPixelSample(null)
  }

  function handleDisplayScaleChange(scale: number) {
    setDisplayScalePercent(clampDisplayScale(scale))
    setPixelSample(null)
  }

  function handleLevelsApply(nextImageData: ImageData) {
    if (!imageDocument) {
      return
    }

    setImageDocument({
      ...imageDocument,
      imageData: nextImageData,
      width: nextImageData.width,
      height: nextImageData.height,
    })
    setLevelsPreviewImageData(null)
    setIsLevelsOpen(false)
    setPixelSample(null)
  }

  function handleLevelsCancel() {
    setLevelsPreviewImageData(null)
    setIsLevelsOpen(false)
  }

  function handleResizeApply(nextImageData: ImageData) {
    if (!imageDocument) {
      return
    }

    setImageDocument({
      ...imageDocument,
      imageData: nextImageData,
      width: nextImageData.width,
      height: nextImageData.height,
    })
    setLevelsPreviewImageData(null)
    setIsResizeOpen(false)
    setPixelSample(null)
    setImageVersion((currentVersion) => currentVersion + 1)
  }

  return (
    <div className="app">
      <Header />
      <Toolbar
        exportFormat={exportFormat}
        canDownload={Boolean(imageDocument)}
        isLoading={isLoading}
        isExporting={isExporting}
        isPipetteActive={isPipetteActive}
        canOpenLevels={Boolean(imageDocument)}
        canOpenResize={Boolean(imageDocument)}
        canScale={Boolean(imageDocument)}
        displayScalePercent={displayScalePercent}
        onFileChange={handleFileChange}
        onExportFormatChange={setExportFormat}
        onDownload={handleDownload}
        onTogglePipette={() => setIsPipetteActive((isActive) => !isActive)}
        onOpenLevels={() => setIsLevelsOpen(true)}
        onOpenResize={() => setIsResizeOpen(true)}
        onDisplayScaleChange={handleDisplayScaleChange}
      />
      <div className="editor-body">
        <Workspace
          imageDocument={imageDocument}
          renderedImageData={scaledDisplayImageData}
          displayedImageData={displayedImageData}
          isPipetteActive={isPipetteActive}
          autoScaleKey={imageVersion}
          onAutoScale={setDisplayScalePercent}
          onPixelPick={setPixelSample}
        />
        <ChannelPanel
          imageDocument={imageDocument}
          channelVisibility={channelVisibility}
          pixelSample={pixelSample}
          onToggleChannel={handleChannelToggle}
        />
      </div>
      <StatusBar
        imageDocument={imageDocument}
        errorMessage={errorMessage}
        isLoading={isLoading}
        isExporting={isExporting}
        isPipetteActive={isPipetteActive}
        isLevelsOpen={isLevelsOpen}
        displayScalePercent={displayScalePercent}
        pixelSample={pixelSample}
      />
      <LevelsDialog
        imageDocument={imageDocument}
        open={isLevelsOpen}
        onPreviewChange={setLevelsPreviewImageData}
        onApply={handleLevelsApply}
        onCancel={handleLevelsCancel}
      />
      <ResizeDialog
        imageDocument={imageDocument}
        open={isResizeOpen}
        onApply={handleResizeApply}
        onCancel={() => setIsResizeOpen(false)}
      />
    </div>
  )
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default App
