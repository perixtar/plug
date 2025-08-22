import { profile } from '@/lib/generated/prisma'
import { User } from '@supabase/supabase-js'
import { create } from 'zustand'

interface ProfileState {
  user: User | null
  profile: profile | null
  initProfileStore: (profile: profile | null, user: User | null) => void
}

const useProfileStore = create<ProfileState>((set) => ({
  user: null,
  profile: null,
  initProfileStore: (profile: profile | null, user: User | null) => {
    set(() => ({
      profile,
      user,
    }))
  },
}))

export default useProfileStore
