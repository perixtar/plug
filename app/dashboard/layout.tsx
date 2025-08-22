import { getCurrentUserProfile } from '../actions/profile/get-profile'
import { InviteMembersDialog } from '@/components/invite/invite-members-dialog'
import { AppSidebar } from '@/components/nav/app-sidebar'
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { SiteURL } from '@/constants/site-url'
import { OnboardingStatus } from '@/lib/generated/prisma'
import { redirect } from 'next/navigation'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentUserProfile()
  if (profile?.onboarding_status === OnboardingStatus.NOT_STARTED) {
    // redirect to onboarding
    redirect(SiteURL.ONBOARDING)
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
      <InviteMembersDialog />
    </SidebarProvider>
  )
}
