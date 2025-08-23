'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { ToolNotFoundException } from '@/exceptions/tool-not-found'
import { tool, workspace_database } from '@/lib/generated/prisma'

const prisma = createPrismaServerClient()

export async function getTools(workspace_id: string): Promise<tool[]> {
  const tools = await prisma.tool.findMany({
    where: {
      workspace_id: workspace_id,
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  return tools
}

export async function getTool(tool_id: string): Promise<tool> {
  console.log(`Fetching tool with ID: ${tool_id}`)

  try {
    const tool = await prisma.tool.findUnique({
      where: {
        id: tool_id,
      },
    })
    if (!tool) {
      throw new ToolNotFoundException(tool_id)
    }
    return tool
  } catch (error) {
    throw new ToolNotFoundException(tool_id, error)
  }
}

export async function getDatabaseFromTool(
  tool_id: string,
): Promise<workspace_database | undefined> {
  const tool = await prisma.tool.findUnique({
    where: {
      id: tool_id,
    },
    select: {
      database_id: true,
    },
  })

  if (!tool || !tool.database_id) {
    return undefined
  }

  const database = await prisma.workspace_database.findUnique({
    where: {
      id: tool.database_id,
    },
  })

  if (!database) {
    return undefined
  }

  return database
}
