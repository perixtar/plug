import { tool, tool_page, workspace_database } from '@/lib/generated/prisma'
import { Message } from '@/lib/messages'

export type ToolPageStartData = {
  current_tool: tool
  tool_messages: Message[]
  workspace_db: workspace_database | null
  db_connected: boolean
}
