'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { getUserFromServer } from '@/clients/supabase-server-client'
import { DeploymentResult } from '@/lib/types'

const prisma = createPrismaServerClient()

/**
 * Update the deployment_id of an assistant message in the database.
 * The precondition is that this message contains code
 * @param assistantMessageId
 * @param deploymentId
 * @returns
 */
export async function updateAssistantMessageDeploymentId(
  assistantMessageId: string,
  deploymentResult: DeploymentResult,
) {
  const user = await getUserFromServer()
  if (!user) {
    throw new Error('User not logged in')
  }

  // 2. Create chat message
  const chatMessage = await prisma.tool_message.update({
    where: {
      id: assistantMessageId,
    },
    data: {
      deployment_result: deploymentResult,
    },
  })

  return chatMessage.id
}

/**
 * @param stdErr
 * @returns
 */
export async function updateAssistantMessageStdErr(
  assistantMessageId: string,
  runtimeError: string,
) {
  const user = await getUserFromServer()
  if (!user) {
    throw new Error('User not logged in')
  }

  // 2. Create chat message
  const chatMessage = await prisma.tool_message.update({
    where: {
      id: assistantMessageId,
    },
    data: {
      runtime_error: runtimeError,
    },
  })

  return chatMessage.id
}
