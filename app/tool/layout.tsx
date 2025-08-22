import { getCurrentUserProfile } from '../actions/profile/get-profile'
import { SiteURL } from '@/constants/site-url'
import { OnboardingStatus } from '@/lib/generated/prisma'
import { redirect } from 'next/navigation'
import React from 'react'

interface LayoutProps {
  children: React.ReactNode
}
const Layout = async ({ children }: LayoutProps) => {
  const profile = await getCurrentUserProfile()
  if (profile?.onboarding_status === OnboardingStatus.NOT_STARTED) {
    // redirect to onboarding
    redirect(SiteURL.ONBOARDING)
  }
  return <div>{children}</div>
}

export default Layout
