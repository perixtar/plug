'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { workspace_database } from '@/lib/generated/prisma'

const prisma = createPrismaServerClient()

/**
 * Gets all databases from a workspace by ID, selecting only ID and nickname.
 * @param workspace_id - The ID of the workspace
 * @returns Array of objects with database ID and nickname
 */
export async function getDatabasesInWorkspace(
  workspace_id: string,
): Promise<workspace_database[]> {
  if (!workspace_id) {
    throw new Error('Missing workspace_id')
  }

  const databases = await prisma.workspace_database.findMany({
    where: {
      workspace_id,
    },
  })

  return databases
}

export async function getWorkspaceDatabase(
  workspace_db_id: string,
): Promise<workspace_database | null> {
  const workspace_db = await prisma.workspace_database.findUnique({
    where: {
      id: workspace_db_id,
    },
  })

  return workspace_db
}

export async function updateTableSchema(
  workspace_db_id: string,
  tableSchema: Record<string, Record<string, any>>,
) {
  await prisma.workspace_database.update({
    where: { id: workspace_db_id },
    data: {
      table_sample: tableSchema,
      updated_at: new Date(),
    },
  })
}
