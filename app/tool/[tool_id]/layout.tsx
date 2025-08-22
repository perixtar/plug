import { ToolDataProvider } from '../../providers'
import { getToolPageStartData } from '@/app/actions/app-start'

type ToolLayoutProps = {
  children: React.ReactNode
  params: Promise<{ tool_id: string }>
}

export default async function ToolLayout({
  children,
  params,
}: ToolLayoutProps) {
  const { tool_id } = await params
  const tool_page_start_data = await getToolPageStartData(tool_id)
  return (
    <ToolDataProvider
      tool={tool_page_start_data.current_tool}
      tool_db={tool_page_start_data.workspace_db}
      tool_messages={tool_page_start_data.tool_messages}
      tool_db_connected={tool_page_start_data.db_connected}
    >
      {children}
    </ToolDataProvider>
  )
}
