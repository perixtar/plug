import { z } from 'zod'

export const InviteUserPayloadSchema = z.object({
  workspace_id: z.string(),
  workspace_name: z.string(),
  invite_user_email: z.string().email(),
  invite_from_user_id: z.string(),
})

// Infer the TypeScript type from the schema
export type InviteUserPayload = z.infer<typeof InviteUserPayloadSchema>
