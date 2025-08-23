import { DbType } from '@/types/database-type'

export * from './postgres-config'
export * from './mongodb-config'
export * from './mysql-config'
export * from './supabase-config'
export * from './firestore-config'

export type DatabaseConfig =
  | {
      type: DbType.Postgresql
      config: import('./postgres-config').PostgresConfig
    }
  | { type: DbType.MongoDB; config: import('./mongodb-config').MongoDBConfig }
  | { type: DbType.MySQL; config: import('./mysql-config').MySQLConfig }
  | {
      type: DbType.Supabase
      config: import('./supabase-config').SupabaseConfig
    }
  | {
      type: DbType.Firestore
      config: import('./firestore-config').FirestoreConfigInterface
    }
  | {
      type: DbType.None
      config: null
    }
