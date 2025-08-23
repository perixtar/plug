import { getDatabaseFromTool } from '@/app/actions/tool/get-tools'
import { getAIModelById } from '@/lib/models'
import { generateText, tool, LanguageModel } from 'ai'
import { z } from 'zod'

const logToConsoleTool = tool({
  description: 'Logs a message to the console',
  parameters: z.object({
    message: z.string().describe('The message to log to the console'),
  }),
  execute: async ({ message }) => {
    console.log('Tool log:', message)
    return `Logged to console: ${message}`
  },
})

const qnaTool = tool({
  description: 'Answer question based on the provided context',
  parameters: z.object({
    question: z.string().describe('The question to answer'),
    context: z
      .string()
      .optional()
      .describe('Optional context to help answer the question'),
  }),
  execute: async ({ question, context }) => {
    const model = getAIModelById('claude-3-5-sonnet-latest')
    // call LLM to generate an answer based on the question
    await generateText({
      model: model as LanguageModel,
      prompt: `Question: ${question}\nContext: ${context || ''}\nAnswer:`,
    })
  },
})

const findRelevantTables = tool({
  description:
    'Find relevant database tables or collections based on user message',
  parameters: z.object({
    currentProjectId: z.string().describe('Current project ID'),
    message: z.string().describe('User message to find relevant collections'),
  }),
  execute: async ({ currentProjectId, message }) => {
    console.log('Finding relevant tables for project:', currentProjectId)
    return await getDatabaseFromTool(currentProjectId)
  },
})

const findRelevantFiles = tool({
  description:
    'Given a user message, find all the relevant files for the coding agent',
  parameters: z.object({
    currentProjectId: z.string().describe('Current project ID'),
    message: z.string().describe('User message to find relevant files'),
  }),
  execute: async ({ currentProjectId, message }) => {
    const model = getAIModelById('claude-3-5-sonnet-latest')
    // call LLM to find relevant files
  },
})
