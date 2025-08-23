'use client'

import { checkNicknameDup } from './database-config-lib'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { workspace_database } from '@/lib/generated/prisma'
import { Key, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

interface SupabaseConfigProps {
  onConnectionTested: (success: boolean, config: SupabaseConfig) => void
  existingDatabases: workspace_database[] | []
}

export interface SupabaseConfig {
  host: string
  apiKey: string
  nickname: string
}

export function SupabaseConfig({
  onConnectionTested,
  existingDatabases,
}: SupabaseConfigProps) {
  const [formData, setFormData] = useState<SupabaseConfig>({
    host: '',
    apiKey: '',
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
          databaseType: 'supabase',
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
    return Boolean(formData.host && formData.apiKey)
  }

  return (
    <div className="space-y-6 mt-8 border-t pt-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Supabase Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Enter your Supabase project URL and API key.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="host">Project URL</Label>
            <Input
              id="host"
              name="host"
              value={formData.host}
              onChange={handleInputChange}
              placeholder="https://your-project.supabase.co"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex">
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={handleInputChange}
                placeholder="your-supabase-api-key"
                className="flex-1"
              />
              <div className="flex items-center justify-center bg-muted px-3 rounded-r-md border border-l-0">
                <Key className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Use your anon/public key for client-side access or service_role
              key for server-side access.
            </p>
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
