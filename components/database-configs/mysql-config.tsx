'use client'

import { checkNicknameDup } from './database-config-lib'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { workspace_database } from '@/lib/generated/prisma'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

interface MySQLConfigProps {
  onConnectionTested: (success: boolean, config: MySQLConfig) => void
  existingDatabases: workspace_database[] | []
}

export interface MySQLConfig {
  host: string
  port: string
  username: string
  password: string
  databaseName: string
  connectionString: string
  nickname: string
}

export function MySQLConfig({
  onConnectionTested,
  existingDatabases,
}: MySQLConfigProps) {
  const [formData, setFormData] = useState<MySQLConfig>({
    host: '',
    port: '3306',
    username: '',
    password: '',
    databaseName: '',
    connectionString: '',
    nickname: '',
  })

  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle')
  const [connectionError, setConnectionError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Reset connection status when configuration changes
    if (connectionStatus !== 'idle') {
      setConnectionStatus('idle')
      onConnectionTested(false, formData)
    }
  }

  const testConnection = async () => {
    if (!checkNicknameDup(existingDatabases, formData.nickname)) {
      return
    }
    setConnectionStatus('testing')
    setConnectionError('')

    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          databaseType: 'mysql',
          config: formData,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setConnectionStatus('success')
        onConnectionTested(true, formData)
      } else {
        setConnectionStatus('error')
        setConnectionError(result.message)
        onConnectionTested(false, formData)
      }
    } catch (error: any) {
      console.error('Error testing connection:', error)
      setConnectionStatus('error')
      setConnectionError(`Connection test failed: ${error.message}`)
      onConnectionTested(false, formData)
    }
  }

  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'testing':
        return (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Testing connection...</span>
          </div>
        )
      case 'success':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Connection successful!</span>
          </div>
        )
      case 'error':
        return (
          <Alert variant="destructive" className="mt-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {connectionError ||
                'Failed to connect to database. Please check your credentials.'}
            </AlertDescription>
          </Alert>
        )
      default:
        return null
    }
  }

  const isValid = () => {
    return Boolean(
      (formData.host &&
        formData.port &&
        formData.username &&
        formData.password &&
        formData.databaseName) ||
        formData.connectionString,
    )
  }

  return (
    <div className="space-y-6 mt-8 border-t pt-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">MySQL Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Enter your MySQL connection details or provide a connection string.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="connectionString">
              Connection String (Optional)
            </Label>
            <Input
              id="connectionString"
              name="connectionString"
              value={formData.connectionString}
              onChange={handleInputChange}
              placeholder="mysql://username:password@host:port/database"
            />
            <p className="text-xs text-muted-foreground">
              If provided, individual connection fields below will be ignored.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              name="host"
              value={formData.host}
              onChange={handleInputChange}
              placeholder="localhost or IP address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              name="port"
              value={formData.port}
              onChange={handleInputChange}
              placeholder="3306"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="root"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="databaseName">Database Name</Label>
            <Input
              id="databaseName"
              name="databaseName"
              value={formData.databaseName}
              onChange={handleInputChange}
              placeholder="my_database"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col space-y-4">
          <Button
            type="button"
            onClick={testConnection}
            disabled={connectionStatus === 'testing' || !isValid()}
            className="w-full md:w-auto"
          >
            {connectionStatus === 'testing' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {connectionStatus === 'success'
              ? 'Test Again'
              : connectionStatus === 'testing'
                ? 'Testing...'
                : 'Test Connection'}
          </Button>
          {renderConnectionStatus()}
        </div>
      </div>
    </div>
  )
}
