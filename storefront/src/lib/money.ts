
export const STORE_CURRENCY_CODE = "EUR";

const storeMoneyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: STORE_CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function formatStoreMoney(amount: number): string {
    const n = Number.isFinite(amount) ? amount : 0;
    return storeMoneyFormatter.format(n);
}

export function formatForCurrency(amount: number, currencyCode: string): string {
    return formatMoney(amount, currencyCode);
}

export function formatMoney(amount: number, currencyCode: string): string {
    const n = Number.isFinite(amount) ? amount : 0;
    const code = currencyCode.trim().toUpperCase() || STORE_CURRENCY_CODE;
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n);
    } catch {
        return formatStoreMoney(n);
    }
}
