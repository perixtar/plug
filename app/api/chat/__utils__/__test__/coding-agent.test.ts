// __tests__/logging.test.ts
import { runCodingAgent } from '..'
import { TemplateId } from '@/lib/generated/prisma'
import { getAIModelById } from '@/lib/models'
import templates from '@/lib/templates'
import { CoreMessage, LanguageModel } from 'ai'
import { describe, it } from 'vitest'

describe('Coding Agent Tests', () => {
  it(
    'create new project from scratch',
    async () => {
      const userRequest =
        'Generate me a landing page for real estate agent. Please breakdown the code into smaller components and keep them in separate files.'
      const model = getAIModelById('claude-3-5-sonnet-latest')
      const template = templates['nextjs15-v1']
      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: userRequest,
        },
      ]

      const codeArtifacts = await runCodingAgent(
        template,
        userRequest,
        model as LanguageModel,
        messages,
      )
      console.log('coding result:', codeArtifacts)
    },
    {
      timeout: 120000, // Set a timeout for the test
    },
  )

  it(
    'update existing project',
    async () => {
      const userRequest =
        'Generate me a landing page for real estate agent. Please breakdown the code into smaller components and keep them in separate files.'
      const model = getAIModelById('claude-3-5-sonnet-latest')
      const template = templates['nextjs15-v1']
      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: userRequest,
        },
      ]
      const projectId = 'test-project-id' // Replace with actual project ID if needed

      const codeArtifacts = await runCodingAgent(
        template,
        userRequest,
        model as LanguageModel,
        messages,
      )
      console.log('coding result:', codeArtifacts)
    },
    {
      timeout: 120000, // Set a timeout for the test
    },
  )
})
