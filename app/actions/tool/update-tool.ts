'use server'

import { createChatMessage } from '../message/create-message'
import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { Message } from '@/lib/messages'
import { CodeArtifact } from '@/lib/schema'

const prisma = createPrismaServerClient()

/**
 * Create assistant message and update the current tool message to it
 * @param tool_id
 * @param assistant_msg_id
 * @returns
 */
export async function updateCurrentToolMessage(
  tool_id: string,
  assistant_msg_id: string,
) {
  if (!tool_id) {
    console.log('tool id not found')
    return
  }
  // Update the tool with the new message id
  await prisma.tool.update({
    where: { id: tool_id },
    data: { current_tool_message_id: assistant_msg_id, updated_at: new Date() },
  })
}

export async function updateToolIcon(tool_id: string, icon: string) {
  if (!tool_id) {
    console.log('tool id not found')
    return
  }
  // Update the tool with the new icon
  await prisma.tool.update({
    where: { id: tool_id },
    data: { icon, updated_at: new Date() },
  })
}

export async function updateToolLatestCodeArtifact(
  tool_id: string,
  code_artifact: CodeArtifact,
) {
  if (!tool_id) {
    console.log('tool id not found')
    return
  }
  // Update the tool with the new message id and latest code artifact
  await prisma.tool.update({
    where: { id: tool_id },
    data: {
      latest_code_artifact: code_artifact,
      updated_at: new Date(),
    },
  })
}
