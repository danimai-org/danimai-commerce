/** ISO 4217 code for storefront display. */
export const STORE_CURRENCY_CODE = "EUR";

const storeMoneyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: STORE_CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/** Format a numeric amount as store currency (e.g. €300.00). */
export function formatStoreMoney(amount: number): string {
    const n = Number.isFinite(amount) ? amount : 0;
    return storeMoneyFormatter.format(n);
}
