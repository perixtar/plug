import { stripe } from '@/clients/stripe-client'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string
  let event: Stripe.Event

  const relevantEvents = new Set([
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ])

  try {
    if (!sig || !webhookSecret)
      return new Response('Webhook secret not found.', { status: 400 })
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    console.log(`🔔  Webhook received: ${event.type}`)
  } catch (err: any) {
    console.log(`❌ Error message: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
        case 'checkout.session.completed':
          // Handle the subscription created, updated, or deleted events when we receive them. For now, we don't have any use case so I leave it empty.
          break
        default:
          throw new Error('Unhandled relevant event!')
      }
    } catch (error) {
      console.log(error)
      return new Response(
        'Webhook handler failed. View your Next.js function logs.',
        {
          status: 400,
        },
      )
    }
  } else {
    return new Response(`Unsupported event type: ${event.type}`, {
      status: 400,
    })
  }
  return new Response(JSON.stringify({ received: true }))
}
