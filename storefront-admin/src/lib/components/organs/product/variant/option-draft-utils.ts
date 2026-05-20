export function normalizeOptionValue(value: string): string {
	return value.trim();
}

export function valuesInclude(values: string[], raw: string): boolean {
	const normalized = normalizeOptionValue(raw).toLowerCase();
	if (!normalized) return true;
	return values.some((v) => normalizeOptionValue(v).toLowerCase() === normalized);
}
