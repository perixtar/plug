'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { tool } from '@/lib/generated/prisma'

const prisma = createPrismaServerClient()

/**
 * Deletes a tool by ID.
 * @returns the deleted tool record, or null if no tool was found
 */
export async function deleteTool(tool_id: string): Promise<tool | null> {
  console.log(`Deleting tool with ID: ${tool_id}`)

  try {
    const deleted = await prisma.tool.delete({
      where: { id: tool_id },
    })
    console.log(`Successfully deleted tool with ID: ${tool_id}`)
    return deleted
  } catch (err: any) {
    // P2025: Record to delete does not exist
    if (err.code === 'P2025') {
      console.warn(`Tool with ID ${tool_id} not found, nothing to delete`)
      return null
    }
    // re-throw any unexpected errors
    throw err
  }
}
