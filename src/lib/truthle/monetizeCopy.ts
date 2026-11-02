/**
 * Monetization copy used by the games UI.
 * Rules: no fake scarcity, no unverified merchant offers, no em or en dashes.
 */
export const MONETIZE_COPY = {
  en: {
    extraAttemptButton: 'Get an Extra Attempt',
    extraAttemptBlurb: 'Finished a round and want another go? Extra Attempt is a one-time €0.99 purchase. It is not a subscription.',
    extraAttemptSuccess: "You're all set. Your Extra Attempt is ready. You can play again now.",
    truthCodeGift: (code: string) => `Share a little truth with a friend. Truth Code ${code} can be applied once for a free Extra Attempt at checkout. It expires at 23:59:59 UTC on the day it was created.`,
    truthCodeGiftAlt: (code: string) => `Share this Truth Code with a friend: ${code}. It can be applied once for a free Extra Attempt at checkout and expires at 23:59:59 UTC on the day it was created. Play at theworldtruth.com/truthle.`,
    adCaptions: [
      'Between rounds, take a breath and look closer. Every puzzle on theworldtruth.com is built to make you question what you think you know.',
      'Streak over? A good moment to see how the next question treats you.',
      'Finished the map? Share your result with a friend and compare how you each read the clues. No prizes, no pressure, just a good excuse to trade notes on what you noticed first.',
    ],
    faq: [
      { q: "I've already finished today's Truthle. What does Extra Attempt do?", a: "Extra Attempt is a one-time €0.99 purchase, charged in EUR. It is not a subscription. It provides one additional try for today's Truthle, even if you have already completed it. If you have a question about a charge or a refund, contact support and have your Stripe receipt handy." },
      { q: 'Does the Extra Attempt renew as a subscription?', a: "No. Extra Attempt is a one-time purchase of €0.99, charged in EUR. It does not renew and there is no subscription to cancel. It simply provides one additional try for today's Truthle once you have already played. If you have a question about a charge, check your Stripe receipt or contact support." },
      { q: 'Can I get a refund for an Extra Attempt?', a: "Extra Attempt is a one-time €0.99 purchase, not a subscription, charged in EUR. If you think you were charged in error or have a problem with your purchase, contact support and have your Stripe receipt handy. Refund eligibility is assessed case by case, and once an Extra Attempt has been used for another try at today's Truthle, it has already been consumed." },
    ],
  },
  fr: {
    extraAttemptButton: 'Acheter une tentative',
    extraAttemptBlurb: 'Une tentative supplémentaire pour rejouer après une manche terminée. Achat unique de 0,99 €, sans abonnement.',
    extraAttemptSuccess: "C'est bon, votre tentative supplémentaire est prête. Vous pouvez rejouer quand vous voulez.",
    truthCodeGift: (code: string) => `Partagez ce code Truthle avec un ami : ${code}. Il peut être utilisé une fois pour une tentative supplémentaire gratuite au paiement. Il expire à 23:59:59 UTC le jour de sa création.`,
    truthCodeGiftAlt: (code: string) => `Un petit cadeau à partager : mon code Truthle ${code} permet une tentative supplémentaire gratuite au paiement. Il expire à 23:59:59 UTC le jour de sa création. Essayez-le ensemble sur theworldtruth.com/truthle.`,
    adCaptions: [
      'Suivez les indices à votre rythme et voyez où mène votre curiosité.',
    ],
    faq: [
      { q: "Est-ce que l'Extra Attempt se renouvelle automatiquement en abonnement ?", a: "Non. L'Extra Attempt est un achat unique de 0,99 €, facturé en euros, et il ne s'agit pas d'un abonnement : aucun renouvellement automatique n'est mis en place. Il débloque simplement une tentative supplémentaire pour le Truthle du jour, une fois que vous avez déjà joué. Pour toute question de remboursement, contactez le support en joignant le reçu Stripe ; les demandes sont traitées au cas par cas." },
      { q: "Puis-je être remboursé pour l'achat d'un Extra Attempt ?", a: "L'Extra Attempt est un achat unique de 0,99 € (il ne s'agit pas d'un abonnement), facturé en euros. Comme il débloque une tentative supplémentaire pour le Truthle du jour, une fois utilisé, il est généralement considéré comme consommé. Pour toute demande de remboursement, contactez notre support en joignant le reçu Stripe correspondant ; chaque demande est examinée au cas par cas, sans garantie de remboursement." },
    ],
  },
} as const

export const T = MONETIZE_COPY.en
