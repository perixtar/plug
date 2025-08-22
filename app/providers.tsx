'use client'

import useProfileStore from './store/profile-store'
import useStripeCustomerStore from './store/stripe-customer-store'
import { useToolMessageStore } from './store/tool-message-store'
import { useToolStore } from './store/tool-store'
import { useToolViewStore } from './store/tool-view-store'
import useWorkspaceStore from './store/workspace-store'
import { tool, tool_page, workspace_database } from '@/lib/generated/prisma'
import { Message } from '@/lib/messages'
import { codeArtifactSchema } from '@/lib/schema'
import { DeploymentResult } from '@/lib/types'
import { AppStartData } from '@/types/app-start-data'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes'
import posthog from 'posthog-js'
import { PostHogProvider as PostHogProviderJS } from 'posthog-js/react'
import { useEffect, useState } from 'react'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_POSTHOG) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: 'identified_only',
    session_recording: {
      recordCrossOriginIframes: true,
    },
  })
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return process.env.NEXT_PUBLIC_ENABLE_POSTHOG ? (
    <PostHogProviderJS client={posthog}>{children}</PostHogProviderJS>
  ) : (
    children
  )
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export function AppStartDataProvider({
  app_start_data,
  children,
}: {
  app_start_data: AppStartData | null
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const { initProfileStore } = useProfileStore()
  const { initWorkspaceStore } = useWorkspaceStore()
  const { initStripeCustomerStore } = useStripeCustomerStore()
  const { initAllToolsNavPages } = useToolViewStore()
  useEffect(() => {
    if (app_start_data) {
      initProfileStore(app_start_data.profile, app_start_data.user)
      initWorkspaceStore(
        app_start_data.workspaces,
        app_start_data.workspace_to_wsdbs,
        app_start_data.workspace_to_tools,
        app_start_data.workspace_to_toolpages,
      )
      initAllToolsNavPages(app_start_data.tool_to_navpages)
      initStripeCustomerStore(
        app_start_data.subscription_status,
        app_start_data.num_tool_message_used,
      )
    }
    setLoading(false)
  }, [
    app_start_data,
    initProfileStore,
    initWorkspaceStore,
    initStripeCustomerStore,
  ])
  if (loading) return null
  return <>{children}</>
}

export function ToolDataProvider({
  children,
  tool,
  tool_db_connected,
  tool_db,
  tool_messages,
}: {
  children: React.ReactNode
  tool: tool | null
  tool_db_connected: boolean
  tool_messages: Message[]
  tool_db: workspace_database | null
}) {
  const { initToolMessageStore } = useToolMessageStore()
  const { initToolStore } = useToolStore()
  const { setCodeArtifact, setDeploymentResult } = useToolViewStore()

  useEffect(() => {
    initToolMessageStore(tool_messages)
    initToolStore(tool, tool_db_connected, tool_db)

    const current_tool_message_id = tool?.current_tool_message_id
    const current_message = tool_messages.find(
      (message) => message.id === current_tool_message_id,
    )
    const codeArtifact = codeArtifactSchema.safeParse(
      current_message?.codeArtifact,
    )
    const deploymentResult = current_message?.deploymentResult
      ? (current_message.deploymentResult as DeploymentResult)
      : undefined
    setCodeArtifact(codeArtifact.data || undefined)
    setDeploymentResult(deploymentResult)
  }, [tool_messages, initToolMessageStore])

  return <>{children}</>
}
