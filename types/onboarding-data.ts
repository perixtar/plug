import { z } from 'zod'

export const OnboardingDataSchema = z.object({
  // Workspace data
  workspaceName: z.string().optional(),
  invitedMemberEmails: z.array(z.string().email()), // Validate emails
})

// Infer the TypeScript type from the schema
export type OnboardingData = z.infer<typeof OnboardingDataSchema>
