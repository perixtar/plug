'use client'

import {
  getStripeCustomerSubscriptionStatus,
  manageBillingPortoal,
  subscribePricingPlan,
} from '@/app/actions/stripe'
import useStripeCustomerStore from '@/app/store/stripe-customer-store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SiteURL } from '@/constants/site-url'
import { StripePlanPriceID, StripePlanType } from '@/constants/stripe-plan'
import { Check } from 'lucide-react'
import type React from 'react'
import { useState, useTransition } from 'react'

export default function PricingPlanDialog({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const subscription_status = useStripeCustomerStore(
    (state) => state.subscription_status,
  )

  const handleDowngradePlan = async () => {
    // take the user to the billing management portal
    startTransition(async () => {
      const subscription_status = await getStripeCustomerSubscriptionStatus()
      if (subscription_status.is_active) {
        try {
          const url = await manageBillingPortoal(SiteURL.DASHBOARD)
          if (url) {
            window.location.href = url
          } else {
            console.error('Failed to get billing portal URL')
          }
        } catch (error) {
          console.error('Error managing billing portal:', error)
        }
      }
    })
  }

  const handlePricingPlanSelected = async (plan_id: string) => {
    console.log('Selected plan:', plan_id)
    // return
    // Handle the selected pricing plan here
    startTransition(async () => {
      const subscription_status = await getStripeCustomerSubscriptionStatus()
      // If the user has active subscription, then redirect to the billing portal
      if (
        subscription_status.plan_id === plan_id &&
        subscription_status.is_active
      ) {
        console.log('Already on this plan, managing billing portal')
        try {
          const url = await manageBillingPortoal(SiteURL.DASHBOARD)
          if (url) {
            window.location.href = url
          } else {
            console.error('Failed to get billing portal URL')
          }
        } catch (error) {
          console.error('Error managing billing portal:', error)
        }
      }
      // if the user does not have active subscription, then redirect to the checkout page
      else {
        console.log('Subscribing to plan:', plan_id)
        const url = await subscribePricingPlan(plan_id)
        if (url) {
          window.location.href = url
        } else {
          console.error('Failed to subscribe to the pricing plan')
        }
      }
    })
  }

  const subscription_plans = [
    {
      id: StripePlanPriceID.FREE,
      type: StripePlanType.FREE,
      name: 'Free Plan',
      description: 'Ideal for individuals',
      price: '$0',
      features: ['Up to 3 projects', 'Basic analytics', 'Community support'],
    },
    {
      id: StripePlanPriceID.PRO,
      type: StripePlanType.PRO,
      name: 'Basic Plan',
      description: 'Perfect for growing businesses',
      price: '$20/month',
      features: [
        'Unlimited projects',
        'Unlimited users',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'API access',
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pricing Plans</DialogTitle>
          <DialogDescription>
            Choose the perfect plan for your needs
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {subscription_plans.map((plan) => (
            <Card key={plan.id} className="border-2">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plan.price}</div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.id === StripePlanPriceID.FREE ? (
                  subscription_status.plan_id === plan.id &&
                  subscription_status.is_active === true ? (
                    <Button className="w-full bg-green-700" disabled={true}>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleDowngradePlan()}
                      disabled={isPending}
                    >
                      {isPending ? 'Processing...' : 'Downgrade Plan'}
                    </Button>
                  )
                ) : subscription_status.plan_id === plan.id &&
                  subscription_status.is_active === true ? (
                  <Button
                    className="w-full bg-green-700"
                    onClick={() => handlePricingPlanSelected(plan.id)}
                    disabled={isPending}
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handlePricingPlanSelected(plan.id)}
                    disabled={isPending}
                  >
                    {isPending ? 'Processing...' : 'Select Plan'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
