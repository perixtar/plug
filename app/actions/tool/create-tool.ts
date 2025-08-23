'use server'

import { createToolPage } from '@/app/actions/page/create-page'
import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { getUserFromServer } from '@/clients/supabase-server-client'
import { DatabaseConfig } from '@/components/database-configs'
import { encryptConfig } from '@/lib/encryption'
import { ToolStatus } from '@/lib/generated/prisma'
import { TemplateId } from '@/lib/generated/prisma'
import { DbType } from '@/types/database-type'

const prisma = createPrismaServerClient()

/**
 * Create the tool and respective db after completing tool creation flow
 * @returns the created toolId
 * @throws Error if user not logged in or any step fails, roll back if later step failed
 */
export async function createTool(
  tool_name: string,
  tool_description: string,
  db_config: DatabaseConfig | null,
  workspace_id: string, // foreign key
  workspace_database_id: string | null, // use existing ws_db
  icon: string,
) {
  console.log('Creating new tool:', tool_name)

  const user = await getUserFromServer()
  if (!user) {
    console.error('User not logged in')
    throw new Error('User not logged in')
  }

  if (workspace_database_id == null && db_config?.type != DbType.None) {
    // new workspace_db needs to be created
    if (db_config == null) {
      console.log('db_config is null')
      return
    }
    const encryptedConfig = await encryptConfig(db_config)
    if (!encryptedConfig) {
      console.error('Failed to encrypt DB config')
      throw new Error('Failed to get encrypted db config')
    }

    let wsDb: { id: string }
    try {
      wsDb = await prisma.workspace_database.create({
        data: {
          db_type: db_config.type as any,
          credential_zipped: encryptedConfig,
          workspace_id: workspace_id,
          nickname: db_config.config.nickname,
        },
      })
      console.log('Created workspace_database:', wsDb.id)
    } catch (err) {
      console.error('Failed to create workspace_database:', err)
      throw new Error('Failed to create workspace database')
    }
    workspace_database_id = wsDb.id
  }

  let tool: { id: string }
  try {
    tool = await prisma.tool.create({
      data: {
        name: tool_name,
        description: tool_description,
        workspace_id: workspace_id,
        database_id: workspace_database_id ?? null,
        status: ToolStatus.DRAFT,
        icon: icon,
        owner_id: user.id,
        template_id: TemplateId.nextjs15_v1,
      },
    })
    console.log('Created tool:', tool.id)
  } catch (err) {
    console.error('Failed to create tool:', err)
    throw new Error('Failed to create tool')
  }

  try {
    await createToolPage('home', tool.id, workspace_id)
    console.log('Successfully created home page')
  } catch (err) {
    console.error('Failed to create home page:', err)
  }

  return tool.id
}
