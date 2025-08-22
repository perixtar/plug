import { StripeSubscriptionStatus } from './stripe-subscription-status'
import { profile, workspace } from '@/lib/generated/prisma'
import {
  WorkspaceToTools,
  WorkspaceToWsDbs,
  WorkspaceToToolPages,
} from '@/types/workspace'
import { User } from '@supabase/supabase-js'

export type AppStartData = {
  user: User
  profile: profile
  workspaces: workspace[] | null
  workspace_to_wsdbs: WorkspaceToWsDbs | null
  workspace_to_tools: WorkspaceToTools | null
  subscription_status: StripeSubscriptionStatus
  num_tool_message_used: number
  workspace_to_toolpages: WorkspaceToToolPages | null
  tool_to_navpages: Record<string, string[]>
} | null
