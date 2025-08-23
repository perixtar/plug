import { getCurrentUserProfile } from '@/app/actions/profile/get-profile'
import { createSupabaseServerClient } from '@/clients/supabase-server-client'
import { SiteURL } from '@/constants/site-url'
import { OnboardingStatus } from '@/lib/generated/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next')

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // if next url is not defined, then we redirect based on the onboarding status
      if (!next) {
        // check the user's onboarding status and redirect accordingly
        const profile = await getCurrentUserProfile()
        next =
          profile?.onboarding_status === OnboardingStatus.COMPLETED
            ? SiteURL.DASHBOARD
            : SiteURL.ONBOARDING
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        console.log('Local Redirecting to next URL: ', `${origin}${next}`)
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        console.log(
          'Forwarded Host Redirecting to next URL: ',
          `https://${forwardedHost}${next}`,
        )
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        console.log('Production Redirecting to next URL: ', `${origin}${next}`)
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}${SiteURL.ERROR.AUTH}`)
}
