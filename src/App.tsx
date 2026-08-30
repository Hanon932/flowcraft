import FlowCanvas from './components/FlowCanvas'
import FreeCanvas from './components/FreeCanvas'
import ManualPanel from './components/ManualPanel'
import MindMapCanvas from './components/MindMapCanvas'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import { useFlowStore } from './store'

function App() {
  const kind = useFlowStore((s) => s.activeDoc().kind ?? 'flowchart')

  return (
    <div className="flex h-screen w-screen bg-white text-neutral-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar />
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1">
            {kind === 'mindmap' ? (
              <MindMapCanvas />
            ) : kind === 'freeform' ? (
              <FreeCanvas />
            ) : (
              <FlowCanvas />
            )}
          </div>
          {kind === 'flowchart' && (
            <div className="w-80 shrink-0 border-l border-neutral-100">
              <ManualPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
