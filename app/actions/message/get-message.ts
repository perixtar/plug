'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { getUserFromServer } from '@/clients/supabase-server-client'
import { Message } from '@/lib/messages'
import { DateTime } from 'luxon'

const prisma = createPrismaServerClient()

export async function getMessages(tool_id: string): Promise<Message[]> {
  const messages = await prisma.tool_message.findMany({
    where: {
      tool_id: tool_id,
    },
    select: {
      id: true,
      content: true,
      code_artifact: true,
      deployment_result: true,
      tool_id: true,
      role: true,
      //   runtime_error: true,
      //   build_error: true,
    },
    orderBy: {
      created_at: 'asc',
    },
  })

  return messages.map(
    (message: any): Message => ({
      id: message.id,
      content: message.content ?? '',
      codeArtifact: message.code_artifact
        ? JSON.parse(message.code_artifact)
        : undefined,
      deploymentResult: message.deployment_result
        ? JSON.parse(message.deployment_result)
        : undefined,
      toolId: message.tool_id,
      role: message.role,
      runtimeError: '',
      buildError: '',
    }),
  )
}
/**
 * @returns number of messages created by the user today
 */
export async function getNumMessagesToday(): Promise<number> {
  const user = await getUserFromServer()
  if (!user) {
    throw new Error('User not logged in')
  }

  // Default timezone to PT
  const startOfDayInUSWest = DateTime.now()
    .setZone('America/Los_Angeles')
    .startOf('day')
    .toJSDate()

  const count = await prisma.tool_message.count({
    where: {
      created_at: {
        gte: startOfDayInUSWest,
      },
      user_id: user.id,
      role: 'user',
    },
  })

  return count
}
