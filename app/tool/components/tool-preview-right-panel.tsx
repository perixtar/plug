'use client'

import { useToolStore } from '@/app/store/tool-store'
import { useToolViewStore } from '@/app/store/tool-view-store'
import { Preview } from '@/components/preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToolViewTab } from '@/constants/tool-view-tab'
import type React from 'react'
import { useShallow } from 'zustand/react/shallow'

export default function ToolPreviewRightPanel() {
  const current_tab = useToolViewStore((state) => state.current_tab)
  const toolToNavPages = useToolViewStore((state) => state.toolToNavPages)
  const current_tool = useToolStore((state) => state.current_tool)
  const global_code_artifact = useToolViewStore(
    (state) => state.global_code_artifact,
  )

  const { setCurrentNavPage } = useToolViewStore()
  const { is_preview_loading, currentNavPage } = useToolViewStore(
    useShallow((state) => ({
      is_preview_loading: state.is_preview_loading,
      currentNavPage: state.currentNavPage,
    })),
  )

  const deploymentResult = useToolViewStore((state) => state.deploymentResult)
  const { setCurrentTab } = useToolViewStore()

  const handleCodeViewClicked = () => {
    setCurrentTab(ToolViewTab.CODE)
  }

  const handlePreviewClicked = () => {
    setCurrentTab(ToolViewTab.PREVIEW)
  }

  return (
    <Card className="w-full h-full shadow-none border-0 rounded-none">
      {current_tool && (
        <CardContent className="p-0 h-full">
          <div className="h-full flex flex-col">
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* make “Preview:” text larger */}
                <span className="text-x font-medium">Preview:</span>
                {toolToNavPages &&
                  toolToNavPages[current_tool.id] &&
                  toolToNavPages[current_tool.id].length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="default" // medium-size button
                          className="px-4" // extra gap, padding, and larger text
                        >
                          {currentNavPage
                            ? currentNavPage
                            : toolToNavPages[current_tool.id][0]}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {toolToNavPages &&
                          toolToNavPages[current_tool.id].map((page) => (
                            <DropdownMenuItem
                              key={page}
                              onClick={() => setCurrentNavPage(page)}
                            >
                              {page}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant={
                    current_tab === ToolViewTab.CODE ? 'outline' : 'ghost'
                  }
                  size="sm"
                  onClick={handleCodeViewClicked}
                >
                  Code
                </Button>
                <Button
                  variant={
                    current_tab === ToolViewTab.PREVIEW ? 'outline' : 'ghost'
                  }
                  disabled={is_preview_loading}
                  size="sm"
                  onClick={handlePreviewClicked}
                >
                  Preview
                </Button>
              </div>
            </div>
            <div className="flex-1 p-6 flex w-full max-h-full items-center justify-center">
              <Preview
                codeArtifact={global_code_artifact}
                result={deploymentResult}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
