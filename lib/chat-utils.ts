import { systemPromptBase } from './prompt/prompt'
import { Message } from '@/lib/messages'
import { CoreMessage, CoreSystemMessage } from 'ai'

export function joinCoreMessages(messages: CoreMessage[]): string {
  return messages
    .map((message) => {
      if (Array.isArray(message.content)) {
        // If content is an array, extract text from each object
        return message.content
          .map((item) => {
            // Use type-safe approach to extract text
            if (item && typeof item === 'object') {
              // Convert to string safely
              return JSON.stringify(item)
            }
            return String(item)
          })
          .join(' ')
      }
      // If content is not an array, use it directly
      return String(message.content)
    })
    .join('.')
}

export const insertSystemPrompts = (
  messages: CoreMessage[],
  dbSpecificSystemPrompt?: string,
): CoreMessage[] => {
  const genericSys: CoreSystemMessage = {
    role: 'system',
    content: systemPromptBase,
  }

  const systemMessages: CoreSystemMessage[] = [genericSys]

  // only insert DB prompt if one was passed
  if (dbSpecificSystemPrompt) {
    systemMessages.push({
      role: 'system',
      content: dbSpecificSystemPrompt,
    })
  }
  return [...systemMessages, ...messages]
}

export const truncateMessages = (
  history: Message[],
  maxMsgs: number,
): Message[] => {
  if (history.length <= maxMsgs) {
    return history
  }
  return history.slice(-maxMsgs)
}

export function isQAResponse(userIntent: string): boolean {
  return !userIntent.includes('<tool-code>')
}
