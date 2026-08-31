import { useEffect } from 'react'
import FlowCanvas from './components/FlowCanvas'
import FreeCanvas from './components/FreeCanvas'
import ManualPanel from './components/ManualPanel'
import MindMapCanvas from './components/MindMapCanvas'
import ReflectionPanel from './components/ReflectionPanel'
import Sidebar from './components/Sidebar'
import Toolbar from './components/Toolbar'
import { redo, undo } from './history'
import { useFlowStore, useUiStore } from './store'

function App() {
  const kind = useFlowStore((s) => s.activeDoc().kind ?? 'flowchart')
  const section = useUiStore((s) => s.section)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="starfield flex h-screen w-screen text-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {section === 'reflection' ? (
          <ReflectionPanel />
        ) : (
          <>
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
                <div className="w-80 shrink-0 border-l border-white/5">
                  <ManualPanel />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
