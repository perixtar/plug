import { z } from 'zod'

export const LoginPayloadSchema = z.object({
  workspace_id: z.string(),
})

// Infer the TypeScript type from the schema
export type LoginPayload = z.infer<typeof LoginPayloadSchema>
