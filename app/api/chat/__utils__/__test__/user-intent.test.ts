// __tests__/logging.test.ts
import { runUserIntentAgent } from '..'
import { Templates } from '@/constants/templates'
import { getAIModelById } from '@/lib/models'
import { CoreMessage, LanguageModel } from 'ai'
import { describe, it, expect, beforeAll } from 'vitest'

describe('Test User Intent Generation', () => {
  it(
    'code generation intent',
    async () => {
      const message =
        'Generate me a landing page for real estate agent. Please breakdown the code into smaller components and keep them in separate files.'
      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: message,
        },
      ]
      const model = getAIModelById('claude-3-5-sonnet-latest')

      const userIntent = await runUserIntentAgent(
        messages,
        Templates['nextjs15-v1'],
        model as LanguageModel,
      )
      console.log('User Intent:', userIntent)
      expect(userIntent.intent).toBe('code_generation')
    },
    {
      timeout: 60000, // Set a timeout for the test
    },
  )

  it(
    'update code intent with project ID',
    async () => {
      const message =
        'Help me update the landing page to include a contact form and a map showing the office location.'
      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: message,
        },
      ]
      const model = getAIModelById('claude-3-5-sonnet-latest')
      const projectId = '28b7f50d-9d47-4752-9190-cf3ee14ad465'

      const userIntent = await runUserIntentAgent(
        messages,
        Templates['nextjs15-v1'],
        model as LanguageModel,
        projectId,
      )
      console.log('User Intent:', userIntent)
      expect(userIntent.projectId).toBe(projectId)
    },
    {
      timeout: 60000, // Set a timeout for the test
    },
  )

  it(
    'informational intent',
    async () => {
      const message = 'Explain the concept of microservices architecture.'
      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: message,
        },
      ]
      const model = getAIModelById('claude-3-5-sonnet-latest')

      const userIntent = await runUserIntentAgent(
        messages,
        Templates['nextjs15-v1'],
        model as LanguageModel,
      )
      console.log('User Intent:', userIntent)
      expect(userIntent.intent).toBe('informational')
    },
    {
      timeout: 60000, // Set a timeout for the test
    },
  )
})
