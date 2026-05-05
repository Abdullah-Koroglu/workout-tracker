declare module "iyzipay" {
  type Callback = (error: unknown, result: Record<string, unknown>) => void;

  class Iyzipay {
    constructor(config?: { apiKey?: string | null; secretKey?: string | null; uri?: string | null });

    static LOCALE: { TR: string; EN: string };
    static CURRENCY: { TRY: string; EUR: string; USD: string; IRR: string; GBP: string; NOK: string; RUB: string; CHF: string };
    static PAYMENT_GROUP: { PRODUCT: string; LISTING: string; SUBSCRIPTION: string };
    static PAYMENT_CHANNEL: { WEB: string };
    static BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };
    static SUBSCRIPTION_STATUS: { ACTIVE: string; PENDING: string; CANCELED: string; EXPIRED: string; UNPAID: string; UPGRADED: string };
    static SUBSCRIPTION_INITIAL_STATUS: { ACTIVE: string; PENDING: string };

    checkoutFormInitialize: {
      create(request: Record<string, unknown>, callback: Callback): void;
    };

    subscriptionCheckoutForm: {
      initialize(request: Record<string, unknown>, callback: Callback): void;
      retrieve(request: Record<string, unknown>, callback: Callback): void;
    };

    subscription: {
      cancel(request: Record<string, unknown>, callback: Callback): void;
    };
  }

  export default Iyzipay;
}