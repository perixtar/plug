'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export default function PostHogProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Initialize PostHog only on the client side
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (typeof window !== 'undefined' && key) {
      posthog.init(key, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        session_recording: {
          recordCrossOriginIframes: true,
        },
      })
    }
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
