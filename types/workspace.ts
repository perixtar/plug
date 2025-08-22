import { tool, tool_page, workspace_database } from '@/lib/generated/prisma'

export type WorkspaceToTools = {
  [key: string]: tool[]
}

export type WorkspaceToWsDbs = {
  [key: string]: workspace_database[]
}
export type WorkspaceToToolPages = {
  [key: string]: tool_page[]
}
