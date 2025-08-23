import { runCodingAgentStream, runUserIntentAgent } from '../__utils__'
import { getDatabaseFromTool } from '@/app/actions/tool/get-tools'
import { isQAResponse } from '@/lib/chat-utils'
import { getAIModelById } from '@/lib/models'
import { LLMModel } from '@/lib/models'
import { CodeArtifact } from '@/lib/schema'
import { CodeTemplate } from '@/types/code-template'
import { LanguageModel, CoreMessage } from 'ai'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    messages,
    userID,
    model,
    template,
    projectId,
  }: {
    messages: CoreMessage[]
    userID: string
    model: LLMModel
    template: CodeTemplate
    projectId?: string
  } = await req.json()

  const modelClient = getAIModelById(model.id)
  let databaseSample = undefined
  if (projectId) {
    const database = await getDatabaseFromTool(projectId)
    databaseSample = database?.table_sample
  }
  const genCode = await runUserIntentAgent(
    messages,
    template,
    modelClient as LanguageModel,
    databaseSample,
  )

  console.log('Generated Code:', genCode)
  if (isQAResponse(genCode)) {
    const codeArtifact = {
      commentary: genCode,
    } as CodeArtifact
    return NextResponse.json(codeArtifact)
  }

  // Stream the coding step
  const result = await runCodingAgentStream(
    template,
    modelClient as LanguageModel,
    [{ role: 'user', content: genCode }],
    projectId,
  )

  return result.toTextStreamResponse()
}
