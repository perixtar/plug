import { workspace_database } from '@/lib/generated/prisma'

export const checkNicknameDup = (
  existingDatabases: workspace_database[] | [],
  nickname: string,
) => {
  const exists = existingDatabases.some((db) => db.nickname === nickname)
  if (exists) {
    alert('Nickname already in use') //TODO change to better alert UI
    return false
  }
  return true
}
