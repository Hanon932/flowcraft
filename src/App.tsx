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
  const selectedNode = useFlowStore((s) => s.selectedNode())
  const section = useUiStore((s) => s.section)
  const showManual = kind === 'flowchart' && selectedNode?.type === 'step'

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }

      const state = useFlowStore.getState()
      if (state.mode !== 'edit') return
      const doc = state.activeDoc()
      if ((doc.kind ?? 'flowchart') !== 'flowchart') return

      if (e.key === 'F2' && state.selectedNodeId) {
        e.preventDefault()
        state.requestEditNode(state.selectedNodeId)
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && state.selectedNodeId) {
        state.copySelectedNode()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        state.pasteNode()
        return
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      if (state.selectedEdgeId) {
        e.preventDefault()
        state.deleteEdge(state.selectedEdgeId)
        return
      }
      if (state.selectedNodeId) {
        e.preventDefault()
        state.deleteStep(state.selectedNodeId)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen w-screen bg-[#fbfbfd] text-[#1d1d1f]">
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
                <div
                  className={`shrink-0 overflow-hidden border-[#d2d2d7] transition-[width] duration-200 ease-out ${
                    showManual ? 'w-80 border-l' : 'w-0 border-l-0'
                  }`}
                >
                  <div className="h-full w-80">
                    <ManualPanel />
                  </div>
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
