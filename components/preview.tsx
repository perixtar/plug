'use client'

import { CodeArtifactCodeView } from './fragment-code'
import { CodeArtifactWebview } from './fragment-web'
import { useToolViewStore } from '@/app/store/tool-view-store'
import { ToolViewTab } from '@/constants/tool-view-tab'
import { CodeArtifact } from '@/lib/schema'
import { DeploymentResult } from '@/lib/types'
import { DeepPartial } from 'ai'

export function Preview({
  codeArtifact,
  result,
}: {
  codeArtifact?: DeepPartial<CodeArtifact>
  result?: DeploymentResult
}) {
  const current_tab = useToolViewStore((state) => state.current_tab)

  return (
    <div className="top-0 left-0 h-full w-full overflow-auto">
      {codeArtifact && (
        <div className="overflow-y-auto w-full h-full">
          {current_tab == ToolViewTab.CODE && codeArtifact.code && (
            <CodeArtifactCodeView
              files={codeArtifact.code.map((file) => ({
                name: file?.file_path || 'untitled',
                content: file?.file_content || '',
              }))}
            />
          )}
          {current_tab == ToolViewTab.PREVIEW && <CodeArtifactWebview />}
        </div>
      )}
    </div>
  )
}
