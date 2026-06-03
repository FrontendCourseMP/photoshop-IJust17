import { useMemo, useState } from 'react'
import { ChannelPanel } from './components/ChannelPanel'
import { Header } from './components/Header'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { Workspace } from './components/Workspace'
import { exportImageFile, loadImageFile } from './codecs/codecRegistry'
import {
  applyChannelVisibility,
  createDefaultChannelVisibility,
} from './image/channelUtils'
import { getExportFileName } from './image/imageUtils'
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
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const displayedImageData = useMemo(() => {
    if (!imageDocument) {
      return null
    }

    return applyChannelVisibility(imageDocument.imageData, channelVisibility)
  }, [imageDocument, channelVisibility])

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

  return (
    <div className="app">
      <Header />
      <Toolbar
        exportFormat={exportFormat}
        canDownload={Boolean(imageDocument)}
        isLoading={isLoading}
        isExporting={isExporting}
        isPipetteActive={isPipetteActive}
        onFileChange={handleFileChange}
        onExportFormatChange={setExportFormat}
        onDownload={handleDownload}
        onTogglePipette={() => setIsPipetteActive((isActive) => !isActive)}
      />
      <div className="editor-body">
        <Workspace
          imageDocument={imageDocument}
          displayedImageData={displayedImageData}
          isPipetteActive={isPipetteActive}
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
        pixelSample={pixelSample}
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
