'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { getUserFromServer } from '@/clients/supabase-server-client'

const prisma = createPrismaServerClient()

export async function getProfileExistenceByEmail(email: string) {
  const user = await getUserFromServer()
  if (!user) {
    throw new Error('User not logged in')
  }

  const profile = await prisma.profile.findFirst({
    where: {
      email: email,
    },
  })

  return !!profile
}

/**
 * Fetch the current user's profile from the database.
 * @returns the current user's profile or null if not logged in
 */
export async function getCurrentUserProfile() {
  const user = await getUserFromServer()
  if (!user) {
    return null
  }

  const profile = await prisma.profile.findFirst({
    where: {
      id: user.id,
    },
  })

  return profile
}
