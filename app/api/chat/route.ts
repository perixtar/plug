import { insertSystemPrompts } from '@/lib/chat-utils'
import { logDebug } from '@/lib/debug-logger'
import { Duration } from '@/lib/duration'
import { getDbSpecificSystemPrompt } from '@/lib/llm-server-utils'
import { getModelClient, getDefaultMode } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import ratelimit from '@/lib/ratelimit'
import {
  codeArtifactSchema,
  qaResponseSchema,
  UserIntentEnum,
} from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { DbType } from '@/types/database-type'
import { streamObject, LanguageModel, CoreMessage, streamText } from 'ai'

export const maxDuration = 60

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

export async function POST(req: Request) {
  const {
    messages,
    userID,
    model,
    config,
    userIntent,
    prevPageNames,
    tableSample,
    dbType,
    template,
  }: {
    messages: CoreMessage[]
    userID: string
    model: LLMModel
    config: LLMModelConfig
    userIntent: UserIntentEnum
    prevPageNames: string[]
    tableSample: Record<string, any[]>
    dbType: DbType
    template?: Templates
  } = await req.json()

  const limit = !config.apiKey
    ? await ratelimit(userID, rateLimitMaxRequests, ratelimitWindow)
    : false

  if (limit) {
    return new Response('You have reached your request limit for the day.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.amount.toString(),
        'X-RateLimit-Remaining': limit.remaining.toString(),
        'X-RateLimit-Reset': limit.reset.toString(),
      },
    })
  }

  logDebug('userID', userID)
  logDebug('model', model.name)
  logDebug('prevPageNames', JSON.stringify(prevPageNames))

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  // TODO: fix

  try {
    if (!template) throw new Error('`template` is required for code generation')
    const dbSpecificSystemPrompt: string = await getDbSpecificSystemPrompt(
      messages,
      template,
      prevPageNames,
      tableSample,
      dbType,
      modelClient as LanguageModel,
    )
    if (userIntent == UserIntentEnum.CodeGeneration) {
      const stream = await streamObject({
        model: modelClient as LanguageModel,
        schema: codeArtifactSchema,
        messages: insertSystemPrompts(messages, dbSpecificSystemPrompt),
        mode: getDefaultMode(model),
        maxRetries: 0, // do not retry on errors
        ...modelParams,
      })
      return stream.toTextStreamResponse()
    } else if (userIntent === UserIntentEnum.Informational) {
      const stream = await streamObject({
        model: modelClient as LanguageModel,
        schema: qaResponseSchema,
        messages: insertSystemPrompts(messages, dbSpecificSystemPrompt),
        mode: getDefaultMode(model),
        maxRetries: 0, // do not retry on errors
        ...modelParams,
      })
      return stream.toTextStreamResponse()
    } else {
      throw new Error(`Unsupported intent: ${userIntent}`)
    }
    // 2) examine the request metadata (raw HTTP body, headers, etc.)
    // const reqMeta = await stream.request!
    // console.log('🔍 Raw request body:', reqMeta.body)
  } catch (error: any) {
    const isRateLimitError =
      error && (error.statusCode === 429 || error.message.includes('limit'))
    const isOverloadedError =
      error && (error.statusCode === 529 || error.statusCode === 503)
    const isAccessDeniedError =
      error && (error.statusCode === 403 || error.statusCode === 401)

    if (isRateLimitError) {
      return new Response(
        'The provider is currently unavailable due to request limit. Try using your own API key.',
        {
          status: 429,
        },
      )
    }

    if (isOverloadedError) {
      return new Response(
        'The provider is currently unavailable. Please try again later.',
        {
          status: 529,
        },
      )
    }

    if (isAccessDeniedError) {
      return new Response(
        'Access denied. Please make sure your API key is valid.',
        {
          status: 403,
        },
      )
    }

    console.error('Error:', error)

    return new Response(
      'An unexpected error has occurred. Please try again later.',
      {
        status: 500,
      },
    )
  }
}
