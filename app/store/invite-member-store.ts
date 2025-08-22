import { create } from 'zustand'

interface InviteMemberStore {
  isInviteMemberDialogOpen: boolean
  emails: string[]
  openInviteMemberDialog: () => void
  closeInviteMemberDialog: () => void
  setEmails: (emails: string[]) => void
  resetEmails: () => void
}

export const useInviteMemberStore = create<InviteMemberStore>((set) => ({
  isInviteMemberDialogOpen: false,
  emails: [],
  openInviteMemberDialog: () => set({ isInviteMemberDialogOpen: true }),
  closeInviteMemberDialog: () => set({ isInviteMemberDialogOpen: false }),
  setEmails: (emails) => set({ emails }),
  resetEmails: () => set({ emails: [] }),
}))
