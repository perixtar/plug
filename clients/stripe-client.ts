import { EnvKey } from '@/constants/env-key'
import Stripe from 'stripe'

export const stripe = new Stripe(EnvKey.STRIPE_SECRET_KEY ?? '', {
  // https://github.com/stripe/stripe-node#configuration
  // https://stripe.com/docs/api/versioning
  apiVersion: '2025-04-30.basil',
  typescript: true,
})
