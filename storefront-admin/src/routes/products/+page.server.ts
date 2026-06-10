import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';
import {
	buildPricesFromRegionPrices,
	type RegionPriceColumn
} from '$lib/components/organs/product/variant/region-prices.js';

const ProductCreateSchema = z.object({
	title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long'),
	subtitle: z.string().max(255, 'Subtitle is too long').optional(),
	handle: z.string().max(255, 'Handle is too long').optional(),
	description: z.string().max(4000, 'Description is too long').optional(),
	thumbnail: z.string().max(25_000_000, 'Thumbnail data is too large').optional(),
	status: z.enum(['draft', 'published']),
	discountable: z.coerce.boolean().default(true),
	collection_ids: z.preprocess(
		(value) => {
			if (Array.isArray(value)) return value;
			if (typeof value !== 'string') return [];
			try {
				const parsed = JSON.parse(value) as unknown;
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		},
		z.array(z.string().uuid('Collection ID must be a valid UUID'))
	),
	category_id: z.string().uuid('Category ID must be a valid UUID').optional().or(z.literal('')),
	tag_ids: z.preprocess(
		(value) => {
			if (Array.isArray(value)) return value;
			if (typeof value !== 'string') return [];
			try {
				const parsed = JSON.parse(value) as unknown;
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		},
		z.array(z.string().uuid('Tag ID must be a valid UUID'))
	),
	sales_channel_ids: z.preprocess(
		(value) => {
			if (Array.isArray(value)) return value;
			if (typeof value !== 'string') return [];
			try {
				const parsed = JSON.parse(value) as unknown;
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		},
		z.array(z.string().uuid('Sales channel ID must be a valid UUID'))
	),
	has_variants: z.coerce.boolean().default(true),
	options: z
		.array(
			z.object({
				title: z.string().min(1, 'Option title is required'),
				values: z.array(z.string().min(1, 'Option value is required')).min(1)
			})
		)
		.default([]),
	variants: z
		.array(
			z.object({
				title: z.string().min(1, 'Variant title is required'),
				option_values: z
					.array(
						z.object({
							title: z.string().min(1, 'Option title is required'),
							value: z.string().min(1, 'Option value is required')
						})
					)
					.min(1, 'Variant option values are required'),
				options: z.record(z.string(), z.string()).optional(),
				sku: z.string().optional(),
				available_count: z.number().int().min(0).optional(),
				allow_backorder: z.boolean().default(false),
				variant_rank: z.number().int().min(0),
				region_prices: z.record(z.string(), z.string()).default({})
			})
		)
		.default([]),
	attributes: z.preprocess(
		(value) => {
			if (Array.isArray(value)) return value;
			if (typeof value !== 'string') return [];
			try {
				return JSON.parse(value);
			} catch {
				return [];
			}
		},
		z
			.array(
				z.object({
					attribute_id: z.string().uuid('Attribute ID must be a valid UUID'),
					value: z.string().min(1, 'Attribute value is required')
				})
			)
			.default([])
	)
});

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

export const load: PageServerLoad = async () => {
	const productCreateForm = await superValidate(zod4(ProductCreateSchema));
	return { productCreateForm };
};

export const actions = {
	create: async ({ request }) => {
		const productCreateForm = await superValidate(request, zod4(ProductCreateSchema));

		if (!productCreateForm.valid) {
			return fail(400, { productCreateForm });
		}

		try {
			const data = productCreateForm.data;
			const cleanHandle = data.handle?.trim() ? data.handle.trim() : undefined;
			const cleanDescription = data.description?.trim() ? data.description.trim() : undefined;
			const cleanThumbnail = data.thumbnail?.trim() ? data.thumbnail.trim() : undefined;
			const cleanCategoryId = data.category_id?.trim() ? data.category_id : undefined;
			const cleanCollectionIds =
				data.collection_ids.length > 0
					? Array.from(new Set(data.collection_ids.map((id) => id.trim()).filter(Boolean)))
					: undefined;
			const optionsForApi = data.has_variants
				? data.options
						.filter((option) => option.title.trim() && option.values.length > 0)
						.map((option) => ({
							title: option.title.trim(),
							values: option.values.map((value) => value.trim())
						}))
				: undefined;

			const optionsByTitle = new Map(
				(optionsForApi ?? []).map((option) => [option.title, new Set(option.values)])
			);

			const activeRegions = await loadActiveRegions();

			const variantsForApi = data.has_variants
				? data.variants.map((variant, index) => {
						const prices = buildPricesFromRegionPrices(
							variant.region_prices ?? {},
							activeRegions
						);
						const rawByTitle = new Map<string, string>();
						for (const option of variant.option_values ?? []) {
							const title = option.title.trim();
							const value = option.value.trim();
							if (title && value) rawByTitle.set(title, value);
						}
						for (const [title, value] of Object.entries(variant.options ?? {})) {
							const cleanTitle = title.trim();
							const cleanValue = value.trim();
							if (cleanTitle && cleanValue && !rawByTitle.has(cleanTitle)) {
								rawByTitle.set(cleanTitle, cleanValue);
							}
						}
						const optionValues = (optionsForApi ?? []).map((option) => {
							const direct = rawByTitle.get(option.title);
							if (direct) return { title: option.title, value: direct };
							// Single-option products can still infer value from variant title.
							if ((optionsForApi?.length ?? 0) === 1) {
								const fromTitle = variant.title.trim();
								if (fromTitle) return { title: option.title, value: fromTitle };
							}
							return { title: option.title, value: '' };
						});
						return {
							title: variant.title.trim(),
							option_values: optionValues,
							sku: variant.sku?.trim() ? variant.sku.trim() : undefined,
							manage_inventory: variant.available_count !== undefined,
							allow_backorder: variant.allow_backorder,
							variant_rank: Number.isFinite(variant.variant_rank) ? variant.variant_rank : index,
							prices
						};
					})
				: undefined;

			if (data.has_variants && variantsForApi && variantsForApi.length > 0) {
				for (const variant of variantsForApi) {
					for (const optionValue of variant.option_values) {
						if (!optionValue.title || !optionValue.value) {
							return fail(400, {
								productCreateForm,
								error: 'Each variant must include all option values.'
							});
						}
						const allowedValues = optionsByTitle.get(optionValue.title);
						if (!allowedValues || !allowedValues.has(optionValue.value)) {
							return fail(400, {
								productCreateForm,
								error: `Invalid variant option value for "${optionValue.title}".`
							});
						}
					}
				}
			}

			const hasAttributeEntries = data.attributes.length > 0;
			if (hasAttributeEntries && !cleanCategoryId) {
				return fail(400, {
					productCreateForm,
					error: 'Select a category when setting attributes.'
				});
			}

			const attributesForApi = hasAttributeEntries
				? data.attributes.map((attribute) => ({
						attribute_id: attribute.attribute_id,
						value: attribute.value.trim()
					}))
				: undefined;

			const payload = {
				title: data.title.trim(),
				handle: cleanHandle,
				description: cleanDescription,
				thumbnail: cleanThumbnail,
				status: data.status,
				is_giftcard: false,
				discountable: data.discountable,
				category_id: cleanCategoryId,
				tag_ids: data.tag_ids.length > 0 ? data.tag_ids : undefined,
				sales_channel_ids: data.sales_channel_ids.length > 0 ? data.sales_channel_ids : undefined,
				options: optionsForApi,
				variants: variantsForApi && variantsForApi.length > 0 ? variantsForApi : undefined,
				attributes: attributesForApi,
				collection_ids:
					cleanCollectionIds?.length && cleanCollectionIds.length > 0
						? cleanCollectionIds
						: undefined
			};

			const productResponse = await client.products.post(payload as never);
			if (productResponse.error) {
				const error = productResponse.error as { value?: { message?: string } };
				return fail(400, {
					productCreateForm,
					error: error.value?.message ?? 'Failed to create product'
				});
			}
			const createdProduct = productResponse.data as { id?: string } | undefined;
			const out = message(productCreateForm, 'Product created successfully');
			return { ...out, createdId: createdProduct?.id };
		} catch (error) {
			const errorMessage =
				error &&
				typeof error === 'object' &&
				'message' in error &&
				typeof error.message === 'string'
					? error.message
					: 'Failed to create product';

			return fail(500, {
				productCreateForm,
				error: errorMessage
			});
		}
	}
} satisfies Actions;
