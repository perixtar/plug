import { UserIntentResponse } from '../schema'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { CoreMessage } from 'ai'

export async function classifyUserIntentSDK(
  messages: CoreMessage[],
  userID: string,
  model: LLMModel,
  config: LLMModelConfig,
): Promise<UserIntentResponse> {
  const response = await fetch('/api/chat/classify', {
    method: 'POST',
    body: JSON.stringify({
      messages,
      userID,
      model,
      config,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to deploy sandbox')
  }

  const result = await response.json()
  return result
}
