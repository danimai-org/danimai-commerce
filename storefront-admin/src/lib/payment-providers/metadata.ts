export type PaymentProviderMetadata = Record<string, string | number | boolean | null>;

export function metadataToString(meta: unknown): string {
	if (meta == null) return '';

	if (typeof meta === 'string') {
		const trimmed = meta.trim();
		if (!trimmed) return '';
		try {
			const parsed = JSON.parse(trimmed) as unknown;
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				return JSON.stringify(parsed, null, 2);
			}
		} catch {
			return meta;
		}
		return meta;
	}

	if (typeof meta === 'object' && !Array.isArray(meta)) {
		try {
			return JSON.stringify(meta, null, 2);
		} catch {
			return '';
		}
	}

	return '';
}

export function parseMetadataFormValue(
	value: string | null | undefined,
	empty: 'omit'
): PaymentProviderMetadata | undefined;
export function parseMetadataFormValue(
	value: string | null | undefined,
	empty: 'null'
): PaymentProviderMetadata | null;
export function parseMetadataFormValue(
	value: string | null | undefined,
	empty: 'omit' | 'null'
): PaymentProviderMetadata | null | undefined {
	const trimmed = (value ?? '').trim();
	if (!trimmed) return empty === 'null' ? null : undefined;

	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed);
	} catch {
		throw new Error('Metadata must be valid JSON');
	}

	if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error('Metadata must be a JSON object');
	}

	const record = parsed as Record<string, unknown>;
	for (const entry of Object.values(record)) {
		if (
			entry !== null &&
			typeof entry !== 'string' &&
			typeof entry !== 'number' &&
			typeof entry !== 'boolean'
		) {
			throw new Error('Metadata values must be strings, numbers, booleans, or null');
		}
	}

	return record as PaymentProviderMetadata;
}
