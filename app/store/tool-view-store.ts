import { deploy } from '../actions/vercel'
import useProfileStore from './profile-store'
import { useToolStore } from './tool-store'
import { ToolViewTab } from '@/constants/tool-view-tab'
import { previewUrl } from '@/lib/preview'
import { CodeArtifact } from '@/lib/schema'
import { DeploymentResult } from '@/lib/types'
import { convertFilePathToUrl } from '@/lib/utils'
import { CodeTemplate } from '@/types/code-template'
import { DeepPartial } from 'ai'
import { create } from 'zustand'

interface ToolViewState {
  current_tab: ToolViewTab
  is_preview_loading: boolean
  global_code_artifact?: DeepPartial<CodeArtifact>
  deploymentResult?: DeploymentResult
  tool_view_url: string
  currentNavPage?: string
  toolToNavPages?: Record<string, string[]>
}

const INITIAL_STATE: ToolViewState = {
  current_tab: ToolViewTab.CODE,
  is_preview_loading: false,
  global_code_artifact: undefined,
  deploymentResult: undefined,
  tool_view_url: '',
  currentNavPage: undefined,
  toolToNavPages: {},
}

interface ToolViewAction {
  initAllToolsNavPages: (toolToNavPages: Record<string, string[]>) => void
  updateToolToNavPages: (tooId: string, navPages: string[]) => void
  setCurrentTab: (tab: ToolViewTab) => void
  setIsPreviewLoading: (is_loading: boolean) => void
  setCodeArtifact: (artifact: DeepPartial<CodeArtifact> | undefined) => void
  setCurrentNavPage: (currentPage: string) => void
  setDeploymentResult: (result: DeploymentResult | undefined) => void
  setToolViewCurrentUrl: (currentPage: string) => void
  pingSandbox: (execution_result: DeploymentResult) => Promise<boolean>
}

export const useToolViewStore = create<ToolViewState & ToolViewAction>(
  (set) => ({
    ...INITIAL_STATE,
    initAllToolsNavPages(toolToNavPages) {
      console.log('Initializing toolToNavPages:', toolToNavPages)
      set({ toolToNavPages })
    },
    updateToolToNavPages: (toolId: string, navPages: string[]) => {
      set((state) => ({
        toolToNavPages: {
          ...state.toolToNavPages,
          [toolId]: navPages,
        },
      }))
    },
    setCurrentTab: (tab: ToolViewTab) => set({ current_tab: tab }),
    setIsPreviewLoading: (is_loading: boolean) =>
      set({ is_preview_loading: is_loading }),
    setCodeArtifact: (artifact: DeepPartial<CodeArtifact> | undefined) =>
      set({ global_code_artifact: artifact }),
    setCurrentNavPage: (currentNavPage: string) => {
      set({ currentNavPage })
    },
    setDeploymentResult: (result: DeploymentResult | undefined) =>
      set({ deploymentResult: result }),
    setToolViewCurrentUrl: (currentPage: string): void => {
      const { deploymentResult } = useToolViewStore.getState()
      const toolViewUrl = previewUrl(
        deploymentResult?.vercelPreviewUrl,
        currentPage,
      )
      set({ tool_view_url: toolViewUrl })
    },

    pingSandbox: async (execution_result: DeploymentResult) => {
      if (!execution_result) {
        console.log('No result available to ping')
        return false
      }

      const currentNavPage = useToolViewStore.getState().currentNavPage || ''
      const sandboxUrl = previewUrl(execution_result.sbxUrl, currentNavPage)
      const proxyUrl = `/api/sandbox/ping?sandbox_url=${encodeURIComponent(sandboxUrl)}`

      const timeoutMs = 10000
      const intervalMs = 1000
      const maxAttempts = Math.floor(timeoutMs / intervalMs)

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const response = await fetch(proxyUrl, { method: 'HEAD' })
          if (response.status === 200) {
            return true
          }
        } catch (err) {
          // Ignore: likely network hiccup or sandbox not ready yet
          console.debug?.(`pingSandbox attempt ${attempt + 1} failed: ${err}`)
        }

        // Wait before next retry if not last attempt
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, intervalMs))
        }
      }

      return false // Timed out after retries
    },
  }),
)
