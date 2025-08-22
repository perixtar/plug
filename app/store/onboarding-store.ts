'use client'

import { OnboardingData } from '@/types/onboarding-data'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type OnboardingStore = {
  onboardingData: OnboardingData
  updateOnboardingData: (newData: Partial<OnboardingData>) => void
  clearData: () => void
}

// TODO: remove the perisisted data after user has completed the onboarding
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      onboardingData: {
        workspaceName: '',
        invitedMemberEmails: [],
      },
      updateOnboardingData: (newData) =>
        set((state) => ({
          onboardingData: { ...state.onboardingData, ...newData },
        })),
      clearData: () =>
        set(() => ({
          onboardingData: {
            workspaceName: '',
            invitedMemberEmails: [],
          },
        })),
    }),
    {
      name: 'onboarding-store', // Key for localStorage
      partialize: (state) => ({ onboardingData: state.onboardingData }), // Only persist onboardingData
    },
  ),
)
