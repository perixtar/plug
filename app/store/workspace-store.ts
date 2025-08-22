import { deleteTool } from '../actions/tool/delete-tool'
import { updateToolIcon as updateToolIconAction } from '../actions/tool/update-tool'
import { tool, workspace } from '@/lib/generated/prisma'
import {
  WorkspaceToWsDbs,
  WorkspaceToTools,
  WorkspaceToToolPages,
} from '@/types/workspace'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WorkspaceState {
  workspaces: workspace[] | null
  current_workspace_id: string | null
  workspace_to_wsdb: WorkspaceToWsDbs | null
  workspace_to_tools: WorkspaceToTools | null
  workspace_to_toolpages: WorkspaceToToolPages | null
}

const INITIAL_STATE: WorkspaceState = {
  workspaces: [],
  current_workspace_id: null,
  workspace_to_wsdb: {},
  workspace_to_tools: {},
  workspace_to_toolpages: {},
}

interface WorkspaceAction {
  initWorkspaceStore: (
    workspaces: workspace[] | null,
    workspace_to_wsdb: WorkspaceToWsDbs | null,
    workspace_to_tools: WorkspaceToTools | null,
    workspace_to_toolpages: WorkspaceToToolPages | null,
  ) => void
  setCurrentWorkspace: (workspace_id: string) => void
  updateToolIcon: (tool_id: string, icon: string) => void
  removeToolFromWorkspace: (workspace_id: string, tool_id: string) => void
}

export const useWorkspaceStore = create<WorkspaceState & WorkspaceAction>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      initWorkspaceStore: (
        workspaces,
        workspace_to_wsdb,
        workspace_to_tools,
        workspace_to_toolpages,
      ) => {
        set(() => ({
          workspaces,
          workspace_to_wsdb,
          workspace_to_tools,
          workspace_to_toolpages,
          current_workspace_id: workspaces?.[0]?.id ?? null,
        }))
      },

      setCurrentWorkspace: (workspace_id) => {
        set(() => ({ current_workspace_id: workspace_id }))
      },

      updateToolIcon: (tool_id, icon) => {
        // Optimistically update in local state
        set((state) => {
          const wsId = state.current_workspace_id
          if (!wsId || !state.workspace_to_tools) return {}
          const tools = state.workspace_to_tools[wsId] || []
          const updatedTools = tools.map((t) =>
            t.id === tool_id ? { ...t, icon } : t,
          )
          return {
            workspace_to_tools: {
              ...state.workspace_to_tools,
              [wsId]: updatedTools,
            },
          }
        })
        // Persist change on the server
        updateToolIconAction(tool_id, icon)
      },

      removeToolFromWorkspace: (workspace_id, tool_id) => {
        // Fire-and-forget server deletion
        deleteTool(tool_id)
        // Update local state
        set((state) => {
          const updatedMap: WorkspaceToTools = {
            ...(state.workspace_to_tools ?? {}),
          }
          const toolsForWs = updatedMap[workspace_id] ?? []
          updatedMap[workspace_id] = toolsForWs.filter(
            (t: tool) => t.id !== tool_id,
          )
          return { workspace_to_tools: updatedMap }
        })
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        current_workspace_id: state.current_workspace_id,
      }),
    },
  ),
)

export default useWorkspaceStore
