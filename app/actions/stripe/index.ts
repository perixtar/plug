'use server'

import { stripe } from '@/clients/stripe-client'
import { getUserFromServer } from '@/clients/supabase-server-client'
import { SiteURL } from '@/constants/site-url'
import { StripePlanPriceID, StripePlanType } from '@/constants/stripe-plan'
import { StripeSubscriptionStatus } from '@/types/stripe-subscription-status'

export async function getStripeCustomerSubscriptionStatus(): Promise<StripeSubscriptionStatus> {
  const user = await getUserFromServer()
  if (!user) {
    throw new Error('User not logged in')
  }

  await createOrRetrieveCustomer({
    email: user.email || '',
    uuid: user.id,
  })
  const subscriptions = await stripe.subscriptions.list({
    customer: user.id,
    status: 'active',
    limit: 1,
  })
  if (subscriptions.data.length === 0) {
    return {
      customer_id: user.id,
      plan_id: StripePlanPriceID.FREE,
      is_active: false,
    }
  }
  return {
    customer_id: user.id,
    plan_id: subscriptions.data[0].items.data[0].price.id,
    is_active: true,
  }
}

/**
 * If the user has active subscription, then redirect to the billing portal
 */
export async function manageBillingPortoal(relative_return_url: string) {
  const subscription = await getStripeCustomerSubscriptionStatus()
  if (!subscription || !subscription.is_active) {
    // we should check the subscription status before calling this function
    throw new Error('No active subscription found')
  }
  const { url } = await stripe.billingPortal.sessions.create({
    customer: subscription.customer_id,
    return_url: `${SiteURL.BASE}${relative_return_url}`,
  })
  return url
}

export async function subscribePricingPlan(
  plan_id: string,
  success_url?: string,
  cancel_url?: string,
) {
  const user = await getUserFromServer()
  if (!user) {
    throw new Error('User not logged in')
  }
  const { url } = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: plan_id,
        quantity: 1,
      },
    ],
    success_url: success_url || `${SiteURL.BASE}`,
    cancel_url: cancel_url || `${SiteURL.BASE}`,
    metadata: {
      user_id: user.id,
    },
    allow_promotion_codes: true,
    customer: await createOrRetrieveCustomer({
      email: user.email || '',
      uuid: user.id,
    }),
  })
  return url
}

const createOrRetrieveCustomer = async ({
  email,
  uuid,
}: {
  email: string
  uuid: string
}) => {
  try {
    const existingStripeCustomer = await stripe.customers.retrieve(uuid)
    return existingStripeCustomer.id
  } catch (error) {
    // If the customer does not exist, create a new one
    const stripeIdToInsert = await createCustomerInStripe(uuid, email)
    return stripeIdToInsert
  }
}

const createCustomerInStripe = async (uuid: string, email: string) => {
  const customerData = { email: email, id: uuid }
  const newCustomer = await stripe.customers.create(customerData)
  if (!newCustomer) throw new Error('Stripe customer creation failed.')
  return newCustomer.id
}
