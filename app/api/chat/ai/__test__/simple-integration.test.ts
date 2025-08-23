// __tests__/logging.test.ts
import { POST } from '@/app/api/chat/ai/route'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { UserIntentEnum } from '@/lib/schema'
import templates from '@/lib/templates'
import { streamObject, CoreMessage, streamText } from 'ai'
import { describe, it, expect } from 'vitest'

describe('POST /api/chat/ai', () => {
  it(
    'returns 200 and success message when JSON is well-formed',
    async () => {
      const messages: CoreMessage[] = [
        {
          role: 'user',
          content:
            'Generate me a landing page for real estate agent. Please breakdown the code into smaller components and keep them in separate files.',
        },
      ]
      const model: LLMModel = {
        id: 'claude-3-5-sonnet-latest',
        provider: 'Anthropic',
        providerId: 'anthropic',
        name: 'Claude 3.5 Sonnet',
      }

      const req = new Request('http://localhost/api/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: '123',
          messages,
          model,
          template: templates['nextjs15-v1'],
          projectId: '1470c899-4ab9-4d9b-95d9-7b61bd6c23d1',
        }),
      })

      const res = await POST(req)

      // NextResponse.json defaults to status 200
      // expect(res).toBeInstanceOf(NextResponse)
      expect(res.status).toBe(200)

      const data = await res.text()
      console.log('Response data:', data)
    },
    {
      timeout: 120000, // Set a timeout for the test
    },
  )

  it(
    'informational request',
    async () => {
      const messages: CoreMessage[] = [
        {
          role: 'user',
          content:
            'Could you please explain what is fibnacci sequence and how it works?',
        },
      ]
      const model: LLMModel = {
        id: 'claude-3-5-sonnet-latest',
        provider: 'Anthropic',
        providerId: 'anthropic',
        name: 'Claude 3.5 Sonnet',
      }

      const req = new Request('http://localhost/api/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: '123',
          messages,
          model,
          template: templates['nextjs15-v1'],
          projectId: 'test-project-id',
        }),
      })

      const res = await POST(req)

      // NextResponse.json defaults to status 200
      // expect(res).toBeInstanceOf(NextResponse)
      expect(res.status).toBe(200)

      const data = await res.text()
      console.log('Response data:', data)
    },
    {
      timeout: 120000, // Set a timeout for the test
    },
  )
})
