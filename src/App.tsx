import { useState } from 'react'
import { Header } from './components/Header'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { Workspace } from './components/Workspace'
import { exportImageFile, loadImageFile } from './codecs/codecRegistry'
import { getExportFileName } from './image/imageUtils'
import type { ExportFormat, ImageDocument } from './image/imageTypes'
import './App.css'

function App() {
  const [imageDocument, setImageDocument] = useState<ImageDocument | null>(null)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  async function handleFileChange(file: File | null) {
    if (!file) {
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const nextImageDocument = await loadImageFile(file)
      setImageDocument(nextImageDocument)
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
    if (!imageDocument) {
      return
    }

    setIsExporting(true)
    setErrorMessage('')

    try {
      const blob = await exportImageFile(imageDocument, exportFormat)
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

  return (
    <div className="app">
      <Header />
      <Toolbar
        exportFormat={exportFormat}
        canDownload={Boolean(imageDocument)}
        isLoading={isLoading}
        isExporting={isExporting}
        onFileChange={handleFileChange}
        onExportFormatChange={setExportFormat}
        onDownload={handleDownload}
      />
      <Workspace imageDocument={imageDocument} />
      <StatusBar
        imageDocument={imageDocument}
        errorMessage={errorMessage}
        isLoading={isLoading}
        isExporting={isExporting}
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
