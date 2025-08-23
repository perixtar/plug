'use server'

import { joinCoreMessages } from './chat-utils'
import { logDebug } from './debug-logger'
import {
  firestoreSystemPrompt,
  toPromptPageInference,
  withoutDBSystemPrompt,
  toPromptSelectRelevantColl,
  toPromptClassifyUserIntent,
} from './prompt/prompt'
import { UserIntentEnum, userIntentSchema } from './schema'
import { Templates } from '@/lib/templates'
import { DbType } from '@/types/database-type'
import { generateObject, LanguageModel, CoreMessage } from 'ai'
import { z } from 'zod'

async function pageNameInference(
  messages: CoreMessage[],
  prevPageNames: string[],
  modelClient: LanguageModel,
): Promise<string> {
  if (prevPageNames.length == 0) {
    // first page of the app
    return 'home'
  }
  const messageContent = joinCoreMessages(messages)
  const prompt = toPromptPageInference(messageContent, prevPageNames)

  const raw = await generateObject({
    model: modelClient,
    schema: z.object({
      pagename: z.string(),
    }),
    prompt: prompt,
  })
  // TODO: do we need to add verification to the generated string?
  // Won't do for now to see how robust this prompt is
  const pageName = (raw.object as { pagename: string }).pagename.trim()
  return pageName ?? 'home'
}

export async function classifyUserIntent(
  messages: CoreMessage[],
  modelClient: LanguageModel,
): Promise<UserIntentEnum> {
  const messageContent = joinCoreMessages(messages)

  const prompt = toPromptClassifyUserIntent(messageContent)

  const raw = await generateObject({
    model: modelClient,
    schema: userIntentSchema,
    prompt: prompt,
  })

  const intent = (raw.object as { intent: string }).intent.trim()
  return intent as UserIntentEnum
}

async function selectRelevantCollections(
  collections: string[],
  messages: CoreMessage[],
  modelClient: LanguageModel,
  page: string,
): Promise<string[]> {
  //  messages is of type: [ { role: 'user', content: [ [Object] ] } ]
  const messageContent = joinCoreMessages(messages)

  // Create a prompt that provides both the list of collections and the user message.
  const prompt = toPromptSelectRelevantColl(page, messageContent, collections)
  const result = await generateObject({
    model: modelClient,
    output: 'array',
    schema: z.array(z.string()),
    prompt: prompt,
  })

  // Flatten the array of arrays into a single array of strings
  const selectedCollections = result.object.flat()
  logDebug('Message for selection', messageContent)
  logDebug('Selected Collections', selectedCollections.join(','))
  return selectedCollections
}

async function getTableSamples(
  table_sample: Record<any, string[]>,
  tableNames: string[],
) {
  // get sampled rows from each selected tables
  const selected_samples: Record<string, any> = {}

  for (const tableName of tableNames) {
    if (tableName in table_sample) {
      selected_samples[tableName] = table_sample[tableName]
    }
  }

  return selected_samples
}

export async function getDbSpecificSystemPrompt(
  messages: CoreMessage[],
  template: Templates,
  prevPageNames: string[],
  tableSample: Record<string, any[]>,
  dbType: DbType,
  modelClient: LanguageModel,
): Promise<string> {
  // infer the page we are creating
  const page = await pageNameInference(messages, prevPageNames, modelClient)
  logDebug('Infered pagename', page)

  // 1. Extract db tables relevant to the user query
  let prompt
  let selectedTables: string[] = []
  if (dbType == DbType.Firestore) {
    // based on the msgs, determine what db collections need to be used
    const dbTables = Object.keys(tableSample)
    selectedTables = await selectRelevantCollections(
      dbTables,
      messages,
      modelClient as LanguageModel,
      page,
    )
  }

  if (dbType == DbType.None || selectedTables.length == 0) {
    prompt = withoutDBSystemPrompt(page, template)
  } else if (dbType == DbType.Firestore) {
    // 2. Get sample docs from each of those tables
    const tableSamples = await getTableSamples(tableSample, selectedTables)
    prompt = firestoreSystemPrompt(page, template, tableSamples)
  } else {
    throw 'unsupported db type'
  }
  return prompt
}

export async function getFirestoreCollectionDescriptions(
  collections: Record<string, Record<string, any>>,
  modelClient: LanguageModel,
): Promise<Record<string, string>> {
  const prompt = `Below are Firestore collections and example data.\nFor each, write a short description of what the collection stores:
    ${JSON.stringify(collections, null, 2)},
  )}\n\nReturn a JSON object where keys are the collection names and values are the descriptions.`

  const result = await generateObject({
    model: modelClient,
    prompt,
    schema: z.record(z.string()),
  })

  return result.object
}
