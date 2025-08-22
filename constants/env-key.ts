import { isProduction } from '@/lib/utils'

type TEnvKey = {
  STRIPE_SECRET_KEY: string | undefined
}

export const EnvKey: TEnvKey = {
  STRIPE_SECRET_KEY: isProduction
    ? process.env.STRIPE_LIVE_SECRET_KEY
    : process.env.STRIPE_TEST_SECRET_KEY,
}
