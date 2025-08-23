'use server'

import { decryptConfig } from './encryption'
import { workspace_database } from './generated/prisma'
import { FirestoreConfigInterface } from '@/components/database-configs'
import { testFirestoreConnection } from '@/services/firebase-service'
import { DbType } from '@/types/database-type'

export type ValidationResult = {
  success: boolean
  schema?: Record<string, Record<string, any>>
}

export async function validateDbConnection(
  userId: string,
  ws_db: workspace_database,
): Promise<ValidationResult> {
  const encryptedCred = ws_db.credential_zipped
  if (!encryptedCred) {
    return { success: false }
  }

  if (ws_db.db_type == DbType.None) {
    return { success: true }
  } else if (ws_db.db_type == DbType.Firestore) {
    const firestoreConfig = await decryptConfig(DbType.Firestore, encryptedCred)
    const result = await testFirestoreConnection(
      firestoreConfig.config as FirestoreConfigInterface,
    )
    return { success: result.success, schema: result.schema }
  } else {
    console.log('DB not supported yet')
    return { success: false }
  }
}
