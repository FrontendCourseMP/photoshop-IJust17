import { Header } from './components/Header'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { Workspace } from './components/Workspace'
import type { ImageDocument } from './image/imageTypes'
import './App.css'

function App() {
  const imageDocument: ImageDocument | null = null

  return (
    <div className="app">
      <Header />
      <Toolbar />
      <Workspace />
      <StatusBar imageDocument={imageDocument} />
    </div>
  )
}

export default App
