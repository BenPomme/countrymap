/**
 * Monetize-approved copy (pack monetize-copy-2026-10-30).
 * EN is wired in the UI. FR is stored here for a future FR locale (site has no i18n yet).
 * Rules: no fake scarcity, no Amazon coupons, kill-list items not included.
 */
export const MONETIZE_COPY = {
  en: {
    extraAttemptButton: 'Get an Extra Attempt', // ea-07
    extraAttemptBlurb: 'Finished a round and want another go? Extra Attempt (€0.99, one-time) lets you retry once — no subscription, no pressure.', // ea-08
    extraAttemptSuccess: "You're all set — your Extra Attempt is ready. You can play again now.", // ea-16
    truthCodeGift: (code: string) => `Share a little truth with a friend — hand them your Truth Code ${code} for a free Extra Attempt — paste it at checkout.`, // tc-13 (rewritten)
    truthCodeGiftAlt: (code: string) => `Share a Truth Code with a friend — send them ${code} for a free Extra Attempt — paste it at checkout. They can play at theworldtruth.com/truthle.`, // tc-03 (rewritten)
    perfectStoreLine: (code: string) => `Perfect 5/5 — nicely done. If you'd like, ${code} gets you 10% off at Lien & Cie whenever it suits you.`, // t10-04 + 10% off
    adCaptions: [
      'Between rounds, take a breath and look closer — every puzzle on theworldtruth.com is built to make you question what you think you know.', // ad-01
      'Streak over — a good moment to see how the next question treats you.', // ad-02
      'Finished the map? Share your result with a friend and compare how you each read the clues — no prizes, no pressure, just a good excuse to trade notes on what you noticed first.', // ad-12 (map pages only)
    ],
    faq: [
      { q: "I've already finished today's Truthle — what does Extra Attempt do?", a: "Extra Attempt is a one-time €0.99 purchase (charged in EUR, not a subscription) that unlocks one additional try for today's Truthle, even if you've already completed it. It's meant for when you want another go today rather than waiting for tomorrow's set. If you have a question about a charge or a refund, contact support and have your Stripe receipt handy so they can look into it." }, // faq-07
      { q: 'Does the Extra Attempt renew as a subscription?', a: "No. Extra Attempt is a one-time purchase of €0.99, charged in EUR — it does not renew and there's no subscription to cancel. It simply unlocks one additional try for today's Truthle once you've already played. If you have a question about a charge, check your Stripe receipt or contact support." }, // faq-09
      { q: 'Can I get a refund for an Extra Attempt?', a: "Extra Attempt is a one-time €0.99 purchase (not a subscription), charged in EUR. If you think you were charged in error or have a problem with your purchase, contact our support team and have your Stripe receipt handy so we can look into it. Refund eligibility is assessed case by case, and once an Extra Attempt has been used for another try at today's Truthle, it has already been consumed." }, // faq-05
    ],
  },
  fr: {
    extraAttemptButton: 'Acheter une tentative', // ea-24
    extraAttemptBlurb: 'Une tentative supplémentaire pour rejouer après une manche terminée. Achat unique de 0,99 €, sans abonnement.', // ea-25 (essai → tentative)
    extraAttemptSuccess: "C'est bon, votre tentative supplémentaire est prête. Vous pouvez rejouer quand vous voulez.", // ea-36
    truthCodeGift: (code: string) => `Partagez ce code Truthle avec un ami : ${code}. Il pourra obtenir une tentative supplémentaire gratuite (à coller au paiement) — un petit geste pour jouer ensemble sur theworldtruth.com/truthle.`, // tc-15 (rewritten)
    truthCodeGiftAlt: (code: string) => `Un petit cadeau à partager : mon code Truthle ${code} permet à un ami d'obtenir une tentative supplémentaire gratuite (à coller au paiement). Essayez-le ensemble sur theworldtruth.com/truthle.`, // tc-17 (rewritten)
    perfectStoreLine: (code: string) => `Sans-faute, 5/5 ! Et si le cœur vous en dit, le code promo ${code} vous offre 10 % de réduction chez Lien & Cie.`, // t10-12 (dup cut, 10% explicit)
    adCaptions: [
      'Suivez les indices à votre rythme et voyez où mène votre curiosité.', // ad-15 ("par la carte" removed for game context)
    ],
    faq: [
      { q: "Est-ce que l'Extra Attempt se renouvelle automatiquement en abonnement ?", a: "Non. L'Extra Attempt est un achat unique de 0,99 €, facturé en euros, et il ne s'agit pas d'un abonnement : aucun renouvellement automatique n'est mis en place. Il débloque simplement une tentative supplémentaire pour le Truthle du jour, une fois que vous avez déjà joué. Pour toute question de remboursement, contactez le support en joignant le reçu Stripe ; les demandes sont traitées au cas par cas." }, // faq-10
      { q: "Puis-je être remboursé pour l'achat d'un Extra Attempt ?", a: "L'Extra Attempt est un achat unique de 0,99 € (il ne s'agit pas d'un abonnement), facturé en euros. Comme il débloque une tentative supplémentaire pour le Truthle du jour, une fois utilisé, il est généralement considéré comme consommé. Pour toute demande de remboursement, contactez notre support en joignant le reçu Stripe correspondant ; chaque demande est examinée au cas par cas, sans garantie de remboursement." }, // faq-06
    ],
  },
} as const

export const T = MONETIZE_COPY.en
