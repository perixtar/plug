import { getAppStartData } from './actions/app-start'
import './globals.css'
import {
  AppStartDataProvider,
  PostHogProvider,
  ThemeProvider,
} from './providers'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Toolmind AI',
  description: "Open-source version of Anthropic's Artifacts",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // initialize data on app start
  const app_start_data = await getAppStartData()
  // const profile = await getCurrentUserProfile()
  // if (profile?.onboarding_status === OnboardingStatus.NOT_STARTED) {
  //   // redirect to onboarding
  //   redirect(SiteURL.ONBOARDING)
  // }
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <PostHogProvider>
          <AppStartDataProvider app_start_data={app_start_data}>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
            <Analytics />
          </AppStartDataProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
