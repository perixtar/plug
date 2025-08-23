'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { getUserFromServer } from '@/clients/supabase-server-client'

const prisma = createPrismaServerClient()

/**
 * Create the tool page
 */
export async function createToolPage(
  page_name: string,
  tool_id: string,
  workspace_id: string,
) {
  const user = await getUserFromServer()
  if (!user) {
    console.error('User not logged in')
    throw new Error('User not logged in')
  }

  try {
    // Create the tool
    const page = await prisma.tool_page.create({
      data: {
        name: page_name,
        tool_id: tool_id,
        workspace_id: workspace_id,
      },
    })
    return page
  } catch (err) {
    console.error('Failed to create tool_page:', err)
  }
}

/**
 * Get or create the tool page
 */
export async function getOrCreateToolPage(
  page_name: string,
  tool_id: string,
  workspace_id: string,
) {
  const user = await getUserFromServer()
  if (!user) {
    console.error('User not logged in')
    throw new Error('User not logged in')
  }

  try {
    // First try to find existing page
    const existingPage = await prisma.tool_page.findFirst({
      where: {
        name: page_name,
        tool_id: tool_id,
      },
    })

    if (existingPage) {
      return existingPage.id
    }

    // If not found, create it
    const newPage = await prisma.tool_page.create({
      data: {
        name: page_name,
        tool_id: tool_id,
        workspace_id: workspace_id,
      },
    })
    return newPage.id
  } catch (err) {
    console.error('Failed to get or create tool_page:', err)
    throw err
  }
}
