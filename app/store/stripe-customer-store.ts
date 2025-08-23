import { StripePlanPriceID } from "@/constants/stripe-plan";
import { StripeSubscriptionStatus } from "@/types/stripe-subscription-status";
import { create } from "zustand";

export const FREE_TIER_MAX_MSG_PER_DAY = 100000;
const PREMIUM_TIER_MAX_MSG_PER_DAY = 100;

interface StripeCustomerState {
  subscription_status: StripeSubscriptionStatus;
  num_tool_message_used: number;
  initStripeCustomerStore: (
    subscription_status: StripeSubscriptionStatus,
    num_tool_message_used: number
  ) => void;
  incrementNumToolMessagesUsed: () => void;
  getMaxAllowedMsgsPerDay: () => number;
}

const useStripeCustomerStore = create<StripeCustomerState>((set) => ({
  subscription_status: {
    customer_id: "",
    plan_id: StripePlanPriceID.FREE,
    is_active: true,
  },
  num_tool_message_used: 0,
  initStripeCustomerStore: (
    subscription_status: StripeSubscriptionStatus,
    num_tool_message_used: number
  ) => {
    set(() => ({
      subscription_status,
      num_tool_message_used,
    }));
  },
  incrementNumToolMessagesUsed: () =>
    set((state) => ({
      num_tool_message_used: state.num_tool_message_used + 1,
    })),
  getMaxAllowedMsgsPerDay: () => {
    const { subscription_status } = useStripeCustomerStore.getState();
    if (subscription_status.is_active) {
      return PREMIUM_TIER_MAX_MSG_PER_DAY;
    } else {
      return FREE_TIER_MAX_MSG_PER_DAY;
    }
  },
}));

export default useStripeCustomerStore;
