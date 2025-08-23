import { POST } from '@/app/api/chat/ai/route'
import { LLMModel } from '@/lib/models'
import templates from '@/lib/templates'
import { CoreMessage } from 'ai'
import { describe, it, expect } from 'vitest'

describe('POST /api/chat/ai', () => {
  it(
    'Generate code that uses firebase collection',
    async () => {
      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: [
            {
              text: 'I have a collection of feeds in my firestore collection. Build me a feeds page.',
              type: 'text',
            },
          ],
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
          projectId: '1470c899-4ab9-4d9b-95d9-7b61bd6c23d1', // Real tool ID
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)

      const data = await res.text()
      console.log('Response data:', data)
    },
    {
      timeout: 120000, // Set a timeout for the test
    },
  )
})
