'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { getUserFromServer } from '@/clients/supabase-server-client'
import { Message } from '@/lib/messages'

const prisma = createPrismaServerClient()

export async function createChatMessage(msg: Message) {
  const user = await getUserFromServer()
  const tool_id = msg.toolId
  if (!user) {
    console.error('User not logged in')
    throw new Error('User not logged in')
  }
  if (!tool_id) {
    throw new Error(`Invalid tool_id ${tool_id}`)
  }

  // 2. Create chat message
  const chatMessage = await prisma.tool_message.create({
    data: {
      tool_id: tool_id,
      user_id: user.id,
      role: msg.role,
      code_artifact: msg.codeArtifact ? JSON.stringify(msg.codeArtifact) : '',
      deployment_result: msg.deploymentResult
        ? JSON.stringify(msg.deploymentResult)
        : '',
      content: msg.content, // array of text/code/image chunks
      created_at: new Date(),
    },
  })

  return chatMessage.id
}
