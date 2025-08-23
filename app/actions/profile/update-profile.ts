'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { getUserFromServer } from '@/clients/supabase-server-client'
import { OnboardingStatus } from '@/lib/generated/prisma'

const prisma = createPrismaServerClient()

export async function updateProfileOnboardingStatus(
  onboarding_status: OnboardingStatus,
) {
  const user = await getUserFromServer()
  await prisma.profile.update({
    where: {
      id: user?.id,
    },
    data: {
      onboarding_status,
    },
  })
}
