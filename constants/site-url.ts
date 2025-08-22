import { isProduction } from '@/lib/utils'

export const SiteURL = {
  BASE: isProduction
    ? process.env.NEXT_PUBLIC_SITE_URL
    : process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000',
  DASHBOARD: '/dashboard',
  CREATE_NEW_TOOL: '/dashboard/create-new-tool',
  AUTH: '/signup',
  ONBOARDING: '/onboarding',
  INVITE_REDIRECT: '/invite/redirect',
  TOOL: '/tool',

  // API URLs
  API: {
    AUTH_CALLBACK: '/api/auth/callback',
  },

  // Error pages
  ERROR: { AUTH: '/error/auth', NO_ACCESS: '/error/no-access' },
}
