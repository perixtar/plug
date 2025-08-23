'use server'

import { createPrismaServerClient } from '@/clients/prisma-server-client'
import { getUserFromServer } from '@/clients/supabase-server-client'

/**
 * add member to workspace
 * @param workspace_id
 * @returns
 */
export async function addMemberToWorkspace(workspace_id: string) {
  if (!workspace_id) {
    throw new Error('Invalid input')
  }
  const user = await getUserFromServer()
  if (!user) {
    throw new Error('User not logged in')
  }
  const prisma = createPrismaServerClient()
  // Check if the user is already a member of the workspace
  const existingMember = await prisma.profile_to_workspace.findFirst({
    where: {
      user_id: user.id,
      workspace_id: workspace_id,
    },
  })
  if (existingMember) {
    return existingMember
  }
  return await prisma.profile_to_workspace.create({
    data: {
      profile: {
        connectOrCreate: {
          where: { id: user.id },
          create: {
            id: user.id,
            email: user.email!, // email should always present in the user object
          },
        },
      },
      workspace: {
        connect: {
          id: workspace_id,
        },
      },
    },
  })
}

export async function getWorkspaceByUserId(user_id: string) {
  if (!user_id) {
    return null
  }
  const prisma = createPrismaServerClient()
  return await prisma.workspace.findMany({
    where: {
      profile_to_workspace: {
        some: {
          user_id: user_id,
        },
      },
    },
  })
}
