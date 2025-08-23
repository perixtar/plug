// __tests__/logging.test.ts
import { runUserIntentAgent } from '..'
import { Templates } from '@/constants/templates'
import { isQAResponse } from '@/lib/chat-utils'
import { getAIModelById } from '@/lib/models'
import { CoreMessage, LanguageModel } from 'ai'
import { describe, it, expect, beforeAll } from 'vitest'

describe('Test User Intent Generation', () => {
  it('QA response test 1', async () => {
    const message = 'Hello, what can you do?'
    const messages: CoreMessage[] = [{ role: 'user', content: message }]
    const model = getAIModelById('claude-3-5-sonnet-latest')

    const userIntent = await runUserIntentAgent(
      messages,
      Templates['nextjs15-v1'],
      model as LanguageModel,
    )
    console.log('User Intent:', userIntent)
    expect(isQAResponse(userIntent)).toBe(true)
  }, 60000)
  it('QA response test 2', async () => {
    const message = 'What is the weather today?'
    const messages: CoreMessage[] = [{ role: 'user', content: message }]
    const model = getAIModelById('claude-3-5-sonnet-latest')

    const userIntent = await runUserIntentAgent(
      messages,
      Templates['nextjs15-v1'],
      model as LanguageModel,
    )
    console.log('User Intent:', userIntent)
    expect(isQAResponse(userIntent)).toBe(true)
  }, 60000)
  it('negative QA response test', async () => {
    const message = 'Create a feeds page?'
    const messages: CoreMessage[] = [{ role: 'user', content: message }]
    const model = getAIModelById('claude-3-5-sonnet-latest')

    const userIntent = await runUserIntentAgent(
      messages,
      Templates['nextjs15-v1'],
      model as LanguageModel,
    )
    console.log('User Intent:', userIntent)
    expect(isQAResponse(userIntent)).toBe(false)
  }, 60000)
})
