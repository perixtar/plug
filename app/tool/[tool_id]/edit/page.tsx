'use client'

import ChatLeftPanel from '../../components/chat-left-panel'
import ToolPreviewRightPanel from '../../components/tool-preview-right-panel'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import type React from 'react'

export default function ToolPage() {
  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Main content with resizable panels */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[200px] rounded-lg border"
        >
          {/* Left panel */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
            <ChatLeftPanel />
          </ResizablePanel>

          <ResizableHandle />

          {/* Right panel - Preview */}
          <ResizablePanel defaultSize={70}>
            <ToolPreviewRightPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
