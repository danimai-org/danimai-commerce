import { formatMoney } from "$lib/money";

export type VariantPrice = {
	amount: string;
	currency_code: string;
};

export function normalizeCurrencyCode(code: string | null | undefined): string {
	return String(code ?? "")
		.trim()
		.toUpperCase();
}

export function resolveVariantPrice(
	prices: VariantPrice[] | undefined,
	currencyCode: string,
): VariantPrice | null {
	const target = normalizeCurrencyCode(currencyCode);
	if (!target || !prices?.length) return null;
	return (
		prices.find(
			(price) => normalizeCurrencyCode(price.currency_code) === target,
		) ?? null
	);
}

export function priceAmountDecimal(price: VariantPrice | null | undefined): number {
	if (!price?.amount) return Number.NaN;
	const cents = Number.parseInt(String(price.amount), 10);
	if (!Number.isFinite(cents)) return Number.NaN;
	return cents / 100;
}

export function formatVariantPrice(price: VariantPrice | null | undefined): string {
	if (!price) return "—";
	const amount = priceAmountDecimal(price);
	if (!Number.isFinite(amount)) return "—";
	return formatMoney(amount, price.currency_code);
}

export function unitPriceStringFromVariantPrice(
	price: VariantPrice | null | undefined,
): string | null {
	const amount = priceAmountDecimal(price);
	if (!Number.isFinite(amount)) return null;
	return String(amount);
}
