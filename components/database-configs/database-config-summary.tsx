import type { DatabaseConfig } from './index'
import { DbType } from '@/types/database-type'

interface DatabaseConfigSummaryProps {
  databaseConfig: DatabaseConfig | null
}

export function DatabaseConfigSummary({
  databaseConfig,
}: DatabaseConfigSummaryProps) {
  if (!databaseConfig) return null

  const { type, config } = databaseConfig
  switch (type) {
    case DbType.Postgresql:
    case DbType.MySQL:
      return (
        <>
          {config.connectionString ? (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Connection String
              </h3>
              <p className="mt-1 font-medium break-all">
                {config.connectionString.replace(/:[^:@]+@/, ':****@')}
              </p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Host
                </h3>
                <p className="mt-1 font-medium">
                  {config.host}:{config.port}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Database
                </h3>
                <p className="mt-1 font-medium">{config.databaseName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Authentication
                </h3>
                <p className="mt-1 font-medium">{config.username} / ••••••••</p>
              </div>
              {type === DbType.Postgresql && config.ssl && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    SSL
                  </h3>
                  <p className="mt-1 font-medium">Enabled</p>
                </div>
              )}
            </>
          )}
        </>
      )
    case DbType.MongoDB:
      return (
        <>
          {config.connectionString ? (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Connection String
              </h3>
              <p className="mt-1 font-medium break-all">
                {config.connectionString.replace(/:[^:@]+@/, ':****@')}
              </p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Host
                </h3>
                <p className="mt-1 font-medium">
                  {config.host}:{config.port}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Database
                </h3>
                <p className="mt-1 font-medium">{config.databaseName}</p>
              </div>
              {config.username && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Authentication
                  </h3>
                  <p className="mt-1 font-medium">
                    {config.username} / ••••••••
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )
    case DbType.Supabase:
      return (
        <>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Project URL
            </h3>
            <p className="mt-1 font-medium">{config.host}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              API Key
            </h3>
            <p className="mt-1 font-medium">••••••••••••••••</p>
          </div>
        </>
      )
    case DbType.Firestore:
      return (
        <>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              nickname
            </h3>
            <p className="mt-1 font-medium">{config.nickname}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Project ID
            </h3>
            <p className="mt-1 font-medium">{config.projectId}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Client Email
            </h3>
            <p className="mt-1 font-medium">{config.clientEmail}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Private Key
            </h3>
            <p className="mt-1 font-medium">••••••••••••••••</p>
          </div>
          {config.databaseURL && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Database URL
              </h3>
              <p className="mt-1 font-medium">{config.databaseURL}</p>
            </div>
          )}
        </>
      )
    default:
      return null
  }
}
