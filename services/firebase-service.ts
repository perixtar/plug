import { FirestoreConfigInterface } from '@/components/database-configs'
import { getFirestoreCollectionDescriptions } from '@/lib/llm-server-utils'
import { LLMModelConfig } from '@/lib/models'
import { getModelClient } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { LanguageModel } from 'ai'
import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

interface ConnectionResult {
  success: boolean
  message: string
  schema?: Record<string, Record<string, string>>
  error?: any
}

// Keep track of initialized Firebase admin app
let adminApp: admin.app.App | null = null

// sample num rows from each collection
const NUM_ROWS = 3

// when pass sampled data, trim it so it doesnt overflow LLM
const MAX_FIELD_LENGTH = 100

/**
 * Test connection to Firestore with the provided admin configuration
 * Lists all collections and connects as an admin
 */
export async function testFirestoreConnection(
  config: FirestoreConfigInterface,
): Promise<ConnectionResult> {
  try {
    // Validate required fields
    if (!config.projectId) {
      return { success: false, message: 'Project ID is required' }
    }
    if (!config.clientEmail) {
      return {
        success: false,
        message: 'Service Account Client Email is required',
      }
    }
    if (!config.privateKey) {
      return {
        success: false,
        message: 'Service Account Private Key is required',
      }
    }

    try {
      // Clean up any existing app to avoid duplicates
      if (adminApp) {
        try {
          await adminApp.delete()
        } catch (e) {
          console.log('Error deleting existing Firebase admin app:', e)
        }
      }

      // Initialize the Firebase admin app with service account credentials
      adminApp = admin.initializeApp(
        {
          credential: admin.credential.cert({
            projectId: config.projectId,
            clientEmail: config.clientEmail,
            // The private key comes as a string with "\n" characters
            // We need to replace them with actual newlines
            privateKey: config.privateKey.replace(/\\n/g, '\n'),
          }),
          databaseURL: config.databaseURL,
        },
        'admin-connection-test-' + Date.now(),
      )

      // Get Firestore instance
      const db = getFirestore(adminApp)

      // List all collections in the database
      // TODO: What about sub-collections?
      const collections = await db.listCollections()
      const collectionIds = collections.map((col) => col.id)

      // contains schema and coll descriptions, will be saved in db
      const collSchema: Record<string, Record<string, any>> = {}
      // sample doc from each table collection
      const collSamples: Record<string, any> = {}

      for (const col of collections) {
        const snapshot = await col.limit(NUM_ROWS).get()

        const schema: Record<string, string> = {}
        let sampleDoc: Record<string, any> | null = null

        for (const doc of snapshot.docs) {
          const data = doc.data()
          if (!sampleDoc) {
            sampleDoc = trimDocFields(data)
            collSamples[col.id] = sampleDoc
          }

          for (const [key, val] of Object.entries(data)) {
            const type = getFirestoreType(val)
            schema[key] = mergeTypes(schema[key], type)
          }
        }
        collSchema[col.id] = { schema: schema, description: '' }
      }
      // ask LLM to add descriptions for each collection
      const collDescripDict = await getCollDescription(collSamples)

      // update table schema with description
      for (const col of collections) {
        if (col.id in collDescripDict) {
          collSchema[col.id]['description'] = collDescripDict[col.id]
        }
      }

      return {
        success: true,
        message: `Successfully connected to Firestore as admin. Found ${collectionIds.length} collections.`,
        schema: collSchema,
      }
    } catch (error: any) {
      // Handle Firebase initialization errors
      console.error('Firebase admin initialization error:', error)

      // Provide user-friendly error messages based on common error codes
      if (error.code === 'app/duplicate-app') {
        return {
          success: false,
          message: 'Firebase admin app already exists. Please try again.',
          error,
        }
      } else if (error.code === 'app/invalid-credential') {
        return {
          success: false,
          message:
            'Invalid credentials. Please check your service account details.',
          error,
        }
      } else if (
        error.message &&
        error.message.includes('Failed to parse private key')
      ) {
        return {
          success: false,
          message:
            "Failed to parse private key. Make sure it's properly formatted with newlines.",
          error,
        }
      } else if (error.code === 'permission-denied') {
        return {
          success: false,
          message:
            'Permission denied. Make sure your service account has the necessary permissions.',
          error,
        }
      } else {
        return {
          success: false,
          message: `Firebase admin initialization error: ${error.message || 'Unknown error'}`,
          error,
        }
      }
    }
  } catch (error: any) {
    // Handle any other unexpected errors
    console.error('Unexpected error testing Firestore connection:', error)
    return {
      success: false,
      message: `Error connecting to Firestore: ${error.message || 'Unknown error'}`,
      error,
    }
  }
}

function getFirestoreType(val: any): string {
  if (val === null) return 'null'
  if (Array.isArray(val)) return 'array'
  if (val instanceof admin.firestore.Timestamp) return 'timestamp'
  if (val instanceof admin.firestore.GeoPoint) return 'geo_point'
  if (val instanceof admin.firestore.DocumentReference) return 'reference'
  if (typeof val === 'string') return 'string'
  if (typeof val === 'number') return 'number'
  if (typeof val === 'boolean') return 'boolean'
  if (typeof val === 'object') return 'object'

  return typeof val
}

function mergeTypes(existing: string | undefined, newType: string): string {
  if (!existing) return newType
  const types = new Set(existing.split(' | ').concat(newType))
  return [...types].sort().join(' | ')
}

async function getCollDescription(collSamples: Record<string, any>) {
  const llmModelConfig = {
    model: 'claude-3-5-sonnet-latest',
  } as LLMModelConfig

  const filteredModels = modelsList.models.filter((model) => {
    if (process.env.NEXT_PUBLIC_HIDE_LOCAL_MODELS) {
      return model.providerId !== 'ollama'
    }
    return true
  })
  const currentModel = filteredModels.find(
    (model) => model.id === llmModelConfig.model,
  )
  const modelClient = getModelClient(currentModel!, llmModelConfig)

  const collDescripDict = await getFirestoreCollectionDescriptions(
    collSamples,
    modelClient as LanguageModel,
  )
  return collDescripDict
}

function trimDocFields(obj: any): any {
  if (typeof obj === 'string') {
    return obj.length > MAX_FIELD_LENGTH
      ? obj.slice(0, MAX_FIELD_LENGTH) + '...'
      : obj
  }

  if (Array.isArray(obj)) {
    return obj.map(trimDocFields)
  }

  if (obj && typeof obj === 'object') {
    const trimmed: Record<string, any> = {}
    for (const [key, val] of Object.entries(obj)) {
      trimmed[key] = trimDocFields(val)
    }
    return trimmed
  }

  return obj // primitives: number, boolean, null, etc.
}
