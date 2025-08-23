'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { tool_page } from '@/lib/generated/prisma'

const prisma = createPrismaServerClient()

export async function getToolPagesInWorkspace(
  workspace_id: string,
): Promise<tool_page[]> {
  const toolPages = await prisma.tool_page.findMany({
    where: {
      workspace_id: workspace_id,
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  return toolPages
}
