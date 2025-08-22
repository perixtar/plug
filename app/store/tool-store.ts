import { tool, workspace_database } from '@/lib/generated/prisma'
import { tool_page } from '@/lib/generated/prisma'
import { CodeArtifact } from '@/lib/schema'
import { create } from 'zustand'

interface ToolStore {
  current_tool: tool | null
  tool_db_connected: boolean
  tool_db: workspace_database | null
}

const INITIAL_STATE: ToolStore = {
  current_tool: null,
  tool_db_connected: false,
  tool_db: null,
}

interface ToolAction {
  initToolStore: (
    tool: tool | null,
    tool_db_connected: boolean,
    tool_db: workspace_database | null,
  ) => void
}

export const useToolStore = create<ToolStore & ToolAction>((set) => ({
  ...INITIAL_STATE,
  initToolStore: (
    tool: tool | null,
    tool_db_connected: boolean,
    tool_db: workspace_database | null,
  ) => {
    set({
      current_tool: tool,
      tool_db_connected: tool_db_connected,
      tool_db: tool_db,
    })
  },
}))

/**
 * Merge two CodeArtifact objects by combining code files and dependencies.
 *
 * @param current - The current code artifact
 * @param prev - The previous code artifact (full or partial). Optional.
 * @returns A new CodeArtifact with merged code and dependencies
 */
export function mergeCodeArtifacts(
  current: CodeArtifact,
  prev: Partial<CodeArtifact> | undefined,
): CodeArtifact {
  if (!prev) {
    return current
  }
  // 1. Merge additional dependencies (deduplicated)
  const prevDeps =
    prev.additional_dependencies && Array.isArray(prev.additional_dependencies)
      ? prev.additional_dependencies
      : []
  const currDeps =
    current.additional_dependencies &&
    Array.isArray(current.additional_dependencies)
      ? current.additional_dependencies
      : []
  const mergedDependencies = Array.from(new Set([...prevDeps, ...currDeps]))
  const hasAdditional = mergedDependencies.length > 0

  // 2. Merge install commands from both artifacts
  const prevCmd = prev.install_dependencies_command
  const currCmd = current.install_dependencies_command
  const installCommands = Array.from(
    new Set([prevCmd, currCmd].filter((cmd): cmd is string => Boolean(cmd))),
  )
  let installCommand = ''
  if (installCommands.length === 1) {
    installCommand = installCommands[0]!
  } else if (installCommands.length > 1) {
    installCommand = installCommands.join(' && ')
  }

  // 3. Merge code files by file_path (current overrides prev)
  type CodeFile = Exclude<CodeArtifact['code'], undefined>[number]
  const codeMap = new Map<string, CodeFile>()
  ;(prev.code ?? []).forEach((file) => codeMap.set(file.file_path, file))
  current.code!.forEach((file) => codeMap.set(file.file_path, file))
  const mergedCode = Array.from(codeMap.values())

  // 4. Return a new artifact preserving current metadata
  return {
    ...current,
    additional_dependencies: mergedDependencies,
    has_additional_dependencies: hasAdditional,
    install_dependencies_command: installCommand,
    code: mergedCode,
  }
}
