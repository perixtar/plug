import { isProduction } from '@/lib/utils'

export enum StripePlanType {
  FREE = 'FREE',
  PRO = 'PRO',
}

export const StripePlanPriceID: Record<StripePlanType, string> = {
  [StripePlanType.FREE]: isProduction
    ? 'price_1RhkxLRsi3Bm90k7CH7uPtnO' // FREE Plan in live mode
    : 'price_1RhlDm2MmGquorTdRYwrnKHA', // FREE Plan in test mode
  [StripePlanType.PRO]: isProduction
    ? 'price_1RhkuQRsi3Bm90k7qMj0IWKU' // Pro Plan in live mode
    : 'price_1RLHas2MmGquorTdNWzjXvUd', // Pro Plan in test mode
}
