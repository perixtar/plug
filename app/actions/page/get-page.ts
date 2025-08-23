'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { tool_page } from '@/lib/generated/prisma'

const prisma = createPrismaServerClient()

export async function getPages(tool_id: string): Promise<tool_page[]> {
  const pages = await prisma.tool_page.findMany({
    where: {
      tool_id: tool_id,
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  return pages
}
