import FlowCanvas from './components/FlowCanvas'
import ManualPanel from './components/ManualPanel'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'

function App() {
  return (
    <div className="flex h-screen w-screen bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1">
            <FlowCanvas />
          </div>
          <div className="w-80 shrink-0 border-l border-neutral-200 dark:border-neutral-700">
            <ManualPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
