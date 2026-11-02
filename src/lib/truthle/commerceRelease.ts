export function isServerCommerceReady(value: string | undefined): boolean {
  return value === 'true'
}

export const SERVER_COMMERCE_READY = isServerCommerceReady(
  process.env.NEXT_PUBLIC_TWT_SERVER_COMMERCE_READY,
)

export const COMMERCE_UNAVAILABLE_MESSAGE =
  'Commerce is temporarily unavailable. No charge or coin deduction was made. Your saved balance is unchanged.'

export const EXTRA_ATTEMPT_UNAVAILABLE_MESSAGE =
  'Extra Attempts are temporarily unavailable. No charge was made and your saved balance is unchanged.'

export const FRIEND_GIFT_UNAVAILABLE_MESSAGE =
  'Friend gifts are temporarily unavailable. No charge was made and your saved balance is unchanged.'

export const REWARD_PURCHASE_UNAVAILABLE_MESSAGE =
  'Purchases are temporarily unavailable. No coins were deducted and your saved balance and rewards are unchanged.'
