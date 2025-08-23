import { logDebug } from './debug-logger'
import { DatabaseConfig } from '@/components/database-configs'
import { DbType } from '@/types/database-type'
import { Sandbox } from '@e2b/code-interpreter'

// Define an async function to copy the .env file into the sandbox.
export async function copyEnvFileToSandbox(
  sbx: Sandbox,
  dbConfig: DatabaseConfig,
) {
  // Define the path to the local .env file.
  if (dbConfig.type != DbType.Firestore) {
    // db not supported yet
    return
  }

  try {
    const envVars = {
      FIREBASE_PROJECT_ID: dbConfig.config.projectId,
      FIREBASE_ADMIN_CLIENT_EMAIL: dbConfig.config.clientEmail,
      FIREBASE_ADMIN_PRIVATE_KEY: dbConfig.config.privateKey,
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000', // TODO: replace this with actual env for both sandbox and vercel
    }

    const fileContent = Object.entries(envVars)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n')
    await sbx.files.write('.env', fileContent)
    logDebug('.env file Copied To', `sandbox ${sbx.sandboxId}`)
  } catch (error) {
    console.error('Error writing .env content to sandbox:', error)
  }
}
