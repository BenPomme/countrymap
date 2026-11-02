'use strict';

function createFakeStripe(options = {}) {
  const state = {
    promos: options.promos instanceof Map
      ? new Map(options.promos)
      : new Map(Object.entries(options.promos || {})),
    coupons: options.coupons instanceof Map
      ? new Map(options.coupons)
      : new Map(Object.entries(options.coupons || {})),
    prices: new Map(Object.entries(options.prices || {})),
    sessions: new Map(Object.entries(options.sessions || {})),
    idempotency: new Map(),
    promoCreateCalls: 0,
    sessionCreateCalls: 0,
    nextSession: 1,
  };

  const stripe = {
    state,
    promotionCodes: {
      async list({ code } = {}) {
        const matches = [...state.promos.values()].filter((promo) => !code || promo.code === code);
        return { data: matches };
      },
      async create(params, requestOptions = {}) {
        state.promoCreateCalls += 1;
        if (options.failPromoCreate) throw options.failPromoCreate;
        if (requestOptions.idempotencyKey && state.idempotency.has(requestOptions.idempotencyKey)) {
          return state.idempotency.get(requestOptions.idempotencyKey);
        }
        if ([...state.promos.values()].some((promo) => promo.code === params.code)) {
          const error = new Error('Promotion code already exists');
          error.code = 'resource_already_exists';
          throw error;
        }
        const promo = {
          id: `promo_${state.promos.size + 1}`,
          code: params.code,
          active: true,
          expires_at: params.expires_at,
          max_redemptions: params.max_redemptions,
          times_redeemed: 0,
          metadata: params.metadata || {},
          coupon: state.coupons.get(params.coupon) || params.coupon,
          ...options.promoOverrides,
        };
        state.promos.set(promo.code, promo);
        if (requestOptions.idempotencyKey) state.idempotency.set(requestOptions.idempotencyKey, promo);
        return promo;
      },
    },
    coupons: {
      async list() {
        const values = [...state.coupons.values()];
        return {
          async *[Symbol.asyncIterator]() {
            for (const coupon of values) yield coupon;
          },
        };
      },
      async create(params) {
        if (options.failCouponCreate) throw options.failCouponCreate;
        const coupon = {
          id: `coupon_${state.coupons.size + 1}`,
          valid: true,
          percent_off: params.percent_off,
          duration: params.duration,
          applies_to: params.applies_to,
          metadata: params.metadata || {},
        };
        state.coupons.set(coupon.id, coupon);
        return coupon;
      },
      async retrieve(id) {
        const coupon = state.coupons.get(id);
        if (!coupon) throw new Error(`No such coupon: ${id}`);
        return coupon;
      },
    },
    prices: {
      async retrieve(id) {
        const price = state.prices.get(id);
        if (!price) throw new Error(`No such price: ${id}`);
        return price;
      },
    },
    checkout: {
      sessions: {
        async create(params) {
          if (options.failSessionCreate) throw options.failSessionCreate;
          state.sessionCreateCalls += 1;
          const id = `cs_test_${state.nextSession++}`;
          const session = {
            id,
            url: `https://checkout.stripe.test/${id}`,
            status: 'open',
            payment_status: 'unpaid',
            amount_total: params.line_items?.[0]?.quantity ? 99 : 99,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            client_reference_id: params.client_reference_id,
            metadata: params.metadata || {},
            line_items: params.line_items,
            discounts: params.discounts,
            allow_promotion_codes: params.allow_promotion_codes,
            success_url: params.success_url,
            cancel_url: params.cancel_url,
            ...options.sessionOverrides,
          };
          state.sessions.set(id, session);
          return session;
        },
        async retrieve(id) {
          if (options.retrieveError) throw options.retrieveError;
          const session = state.sessions.get(id);
          if (!session) {
            const error = new Error('No such checkout session');
            error.code = 'resource_missing';
            throw error;
          }
          return session;
        },
      },
    },
    webhooks: {
      constructEvent(rawBody, signature, secret) {
        if (options.webhookSignatureError) throw new Error('bad signature');
        if (signature !== 'test-signature' || secret !== 'test-webhook-secret') throw new Error('bad signature');
        return JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody);
      },
    },
  };

  return stripe;
}

module.exports = { createFakeStripe };
