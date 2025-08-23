'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { getUserFromServer } from '@/clients/supabase-server-client'
import { OnboardingStatus } from '@/lib/generated/prisma'

const prisma = createPrismaServerClient()

/**
 * Update the profile after user has completed the signup onboarding process
 * @returns
 */
export async function saveRootUserOnboardingData(workspace_name: string) {
  const user = await getUserFromServer()
  if (!user) {
    throw new Error('User not logged in')
  }

  // Create workspace and connect with user
  const workspace = await prisma.workspace.create({
    data: {
      name: workspace_name,
      profile_to_workspace: {
        create: {
          profile: {
            connect: {
              id: user.id,
            },
          },
        },
      },
    },
  })

  await prisma.profile.update({
    where: {
      id: user.id,
    },
    data: {
      onboarding_status: OnboardingStatus.COMPLETED,
    },
  })

  return {
    workspace,
  }
}
