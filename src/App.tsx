import { useState } from 'react'
import { Header } from './components/Header'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { Workspace } from './components/Workspace'
import { loadImageFile } from './codecs/codecRegistry'
import type { ImageDocument } from './image/imageTypes'
import './App.css'

function App() {
  const [imageDocument, setImageDocument] = useState<ImageDocument | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className="app">
      <Header />
      <Toolbar onFileChange={handleFileChange} isLoading={isLoading} />
      <Workspace imageDocument={imageDocument} />
      <StatusBar
        imageDocument={imageDocument}
        errorMessage={errorMessage}
        isLoading={isLoading}
      />
    </div>
  )
}

export default App
