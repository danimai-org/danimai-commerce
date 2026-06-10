import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';
import {
	ProductUpdateSchema,
	ProductVariantUpdateSchema,
	defaultProductVariantUpdateFormData,
	type ProductDetailPageData
} from '$lib/components/organs/product/product-detail-forms.js';
import {
	buildPricesFromRegionPrices,
	type RegionPriceColumn
} from '$lib/components/organs/product/variant/region-prices.js';

async function loadActiveRegions(): Promise<RegionPriceColumn[]> {
	const res = await client.regions.get({ query: { page: 1, limit: 100 } });
	const rows = res.data?.rows ?? [];
	return rows
		.filter((row) => row.is_active)
		.map((row) => ({
			id: row.id,
			name: row.name,
			currency_code: row.currency_code,
			currency_symbol: row.currency_symbol?.trim() || row.currency_code.toUpperCase()
		}));
}

function parseRegionPricesJson(value: string): Record<string, string> {
	try {
		const parsed = JSON.parse(value) as unknown;
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
		return Object.fromEntries(
			Object.entries(parsed).filter(([, amount]) => typeof amount === 'string')
		);
	} catch {
		return {};
	}
}

export const load = async (): Promise<ProductDetailPageData> => {
	const productUpdateForm = await superValidate(zod4(ProductUpdateSchema));
	const productVariantUpdateForm = await superValidate(
		defaultProductVariantUpdateFormData,
		zod4(ProductVariantUpdateSchema)
	);

	return { productUpdateForm, productVariantUpdateForm };
};

export const actions = {
	update: async ({ request }) => {
		const productUpdateForm = await superValidate(request, zod4(ProductUpdateSchema));

		if (!productUpdateForm.valid) {
			return fail(400, { productUpdateForm });
		}
		const { id, status, title, handle, description, discountable } = productUpdateForm.data;
		const res = await client.products({ id }).put({
			status,
			title,
			handle,
			description,
			discountable
		});

		if (res.error) {
			const err = res.error as { value?: { message?: string } };
			return fail(400, {
				productUpdateForm,
				error: err.value?.message ?? 'Failed to update product'
			});
		}
		return message(productUpdateForm, 'Product updated successfully');
	},
	updateVariant: async ({ request }) => {
		const productVariantUpdateForm = await superValidate(
			request,
			zod4(ProductVariantUpdateSchema)
		);

		if (!productVariantUpdateForm.valid) {
			return fail(400, { productVariantUpdateForm });
		}

		const { id, title, material, sku, ean, upc, barcode, region_prices_json, manage_inventory } =
			productVariantUpdateForm.data;

		if (!id) {
			return fail(400, {
				productVariantUpdateForm,
				error: 'Invalid variant'
			});
		}

		const trimmedSku = sku.trim();
		const body: {
			title: string;
			sku?: string;
			barcode: string | null;
			ean: string | null;
			upc: string | null;
			manage_inventory: boolean;
			metadata?: { material: string };
			prices?: Array<{ amount: number; currency_code: string }>;
		} = {
			title: title.trim(),
			barcode: barcode.trim() || null,
			ean: ean.trim() || null,
			upc: upc.trim() || null,
			manage_inventory,
			...(trimmedSku ? { sku: trimmedSku } : {}),
			...(material.trim() ? { metadata: { material: material.trim() } } : {})
		};

		const activeRegions = await loadActiveRegions();
		const regionPrices = parseRegionPricesJson(region_prices_json);
		const prices = buildPricesFromRegionPrices(regionPrices, activeRegions);
		if (prices.length > 0) {
			body.prices = prices;
		}

		const res = await client['product-variants']({ id }).put(body);

		if (res.error) {
			const err = res.error as { value?: { message?: string } };
			return fail(400, {
				productVariantUpdateForm,
				error: err.value?.message ?? 'Failed to update variant'
			});
		}

		return message(productVariantUpdateForm, 'Variant updated successfully');
	}
} satisfies Actions;
