export type MetadataEntity =
	| 'product'
	| 'product-tag'
	| 'product-category'
	| 'collection'
	| 'product-attribute'
	| 'region'
	| 'sales-channel'
	| 'store'
	| 'customer'
	| 'customer-group'
	| 'payment-provider';

export type MetadataRecord = Record<string, string | number | boolean | null>;

export function metadataToRows(
	meta: Record<string, unknown> | null | undefined
): Array<{ key: string; value: string }> {
	if (!meta || typeof meta !== 'object') return [{ key: '', value: '' }];
	const rows = Object.entries(meta).map(([key, value]) => ({
		key,
		value: value == null ? '' : String(value)
	}));
	return rows.length > 0 ? rows : [{ key: '', value: '' }];
}

export function rowsToMetadata(rows: Array<{ key: string; value: string }>): MetadataRecord {
	const meta: MetadataRecord = {};
	for (const row of rows) {
		const key = row.key.trim();
		if (!key) continue;
		const trimmed = row.value.trim();
		if (trimmed === '') {
			meta[key] = '';
			continue;
		}
		const num = Number(trimmed);
		if (!Number.isNaN(num) && trimmed === String(num)) {
			meta[key] = num;
			continue;
		}
		if (trimmed === 'true') meta[key] = true;
		else if (trimmed === 'false') meta[key] = false;
		else if (trimmed === 'null') meta[key] = null;
		else meta[key] = trimmed;
	}
	return meta;
}
