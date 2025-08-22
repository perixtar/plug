import { PrismaClient } from '@/lib/generated/prisma'

// Module-level variable to hold the singleton instance.
let prisma_client: PrismaClient | null = null

export function createPrismaServerClient(): PrismaClient {
  if (prisma_client) {
    // Return the already initialized PrismaClient
    return prisma_client
  }

  // Initialize the client and connect.
  prisma_client = new PrismaClient()
  return prisma_client
}
