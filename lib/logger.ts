import posthog from 'posthog-js'

const isDev = process.env.NODE_ENV === 'development'
const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_API_KEY
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

let isPosthogInitialized = false

function ensurePosthogInit() {
  if (!isPosthogInitialized && !isDev && POSTHOG_API_KEY) {
    posthog.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
    })
    isPosthogInitialized = true
  }
}

export class Logger {
  static debug(message: string, props?: Record<string, any>) {
    if (isDev) {
      console.debug('[DEBUG]', message, props)
    } else {
      ensurePosthogInit()
      posthog.capture('debug', { message, ...props })
    }
  }

  static info(message: string, props?: Record<string, any>) {
    if (isDev) {
      console.info('[INFO]', message, props)
    } else {
      ensurePosthogInit()
      posthog.capture('info', { message, ...props })
    }
  }

  static warn(message: string, props?: Record<string, any>) {
    if (isDev) {
      console.warn('[WARN]', message, props)
    } else {
      ensurePosthogInit()
      posthog.capture('warn', { message, ...props })
    }
  }

  static error(message: string, props?: Record<string, any>) {
    if (isDev) {
      console.error('[ERROR]', message, props)
    } else {
      ensurePosthogInit()
      posthog.capture('error', { message, ...props })
    }
  }
}
