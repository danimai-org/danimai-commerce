import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const ProductCreateSchema = z.object({
	title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long'),
	subtitle: z.string().max(255, 'Subtitle is too long').optional(),
	handle: z.string().max(255, 'Handle is too long').optional(),
	description: z.string().max(4000, 'Description is too long').optional(),
	status: z.enum(['draft', 'published']),
	discountable: z.coerce.boolean().default(true),
	collection_id: z.string().uuid('Collection ID must be a valid UUID').optional().or(z.literal('')),
	category_id: z.string().uuid('Category ID must be a valid UUID').optional().or(z.literal('')),
	tag_ids: z.preprocess((value) => {
		if (Array.isArray(value)) return value;
		if (typeof value !== 'string') return [];
		try {
			const parsed = JSON.parse(value) as unknown;
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}, z.array(z.string().uuid('Tag ID must be a valid UUID'))),
	sales_channel_ids: z.preprocess((value) => {
		if (Array.isArray(value)) return value;
		if (typeof value !== 'string') return [];
		try {
			const parsed = JSON.parse(value) as unknown;
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}, z.array(z.string().uuid('Sales channel ID must be a valid UUID'))),
	has_variants: z.coerce.boolean().default(true),
	options: z.preprocess(
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
					title: z.string().min(1, 'Option title is required'),
					values: z.array(z.string().min(1, 'Option value is required')).min(1)
				})
			)
			.default([])
	),
	variants: z.preprocess(
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
					title: z.string().min(1, 'Variant title is required'),
					options: z.record(z.string(), z.string()),
					sku: z.string().optional(),
					available_count: z.number().int().min(0).optional(),
					allow_backorder: z.boolean().default(false),
					variant_rank: z.number().int().min(0),
					price_amount: z.string().optional()
				})
			)
			.default([])
	),
	attribute_group_id: z.string().uuid('Attribute group ID must be a valid UUID').optional().or(z.literal('')),
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
			const cleanCategoryId = data.category_id?.trim() ? data.category_id : undefined;
			const cleanCollectionId = data.collection_id?.trim() ? data.collection_id : undefined;
			const cleanAttributeGroupId = data.attribute_group_id?.trim() ? data.attribute_group_id : undefined;

			const optionsForApi = data.has_variants
				? data.options
						.filter((option) => option.title.trim() && option.values.length > 0)
						.map((option) => ({
							title: option.title.trim(),
							values: option.values.map((value) => value.trim())
						}))
				: undefined;

			const variantsForApi = data.has_variants
				? data.variants.map((variant, index) => {
						const parsedPrice = variant.price_amount?.trim()
							? parseFloat(variant.price_amount.trim())
							: Number.NaN;
						return {
							title: variant.title.trim(),
							sku: variant.sku?.trim() ? variant.sku.trim() : undefined,
							manage_inventory: variant.available_count !== undefined,
							allow_backorder: variant.allow_backorder,
							variant_rank: Number.isFinite(variant.variant_rank) ? variant.variant_rank : index,
							prices:
								Number.isFinite(parsedPrice) && parsedPrice > 0
									? [{ amount: Math.round(parsedPrice * 100), currency_code: 'eur' }]
									: []
						};
					})
				: undefined;

			const hasAttributeEntries = data.attributes.length > 0;
			if (hasAttributeEntries && !cleanAttributeGroupId) {
				return fail(400, {
					productCreateForm,
					error: 'Select an attribute group when setting attributes.'
				});
			}

			const attributesForApi =
				hasAttributeEntries && cleanAttributeGroupId
					? data.attributes.map((attribute) => ({
							attribute_group_id: cleanAttributeGroupId,
							attribute_id: attribute.attribute_id,
							value: attribute.value.trim()
						}))
					: undefined;

			const payload = {
				title: data.title.trim(),
				handle: cleanHandle,
				description: cleanDescription,
				status: data.status,
				is_giftcard: false,
				discountable: data.discountable,
				category_id: cleanCategoryId,
				attribute_group_id: cleanAttributeGroupId,
				tag_ids: data.tag_ids.length > 0 ? data.tag_ids : undefined,
				sales_channel_ids: data.sales_channel_ids.length > 0 ? data.sales_channel_ids : undefined,
				options: optionsForApi,
				variants: variantsForApi && variantsForApi.length > 0 ? variantsForApi : undefined,
				attributes: attributesForApi
			};

			const productResponse = await client.products.post(payload as never);
			if (productResponse.error) {
				const error = productResponse.error as { value?: { message?: string } };
				return fail(400, {
					productCreateForm,
					error: error.value?.message ?? 'Failed to create product'
				});
			}

			const product = (productResponse.data ?? null) as { id?: string } | null;
			if (cleanCollectionId && product?.id) {
				const collectionResponse = await client['collections']({ id: cleanCollectionId }).products.put({
					products: {
						add: [product.id],
						remove: []
					}
				});
				if (collectionResponse.error) {
					const error = collectionResponse.error as { value?: { message?: string } };
					return fail(400, {
						productCreateForm,
						error: error.value?.message ?? 'Product created, but failed to add it to collection'
					});
				}
			}

			return message(productCreateForm, 'Product created successfully');
		} catch (error) {
			const errorMessage =
				error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
					? error.message
					: 'Failed to create product';

			return fail(500, {
				productCreateForm,
				error: errorMessage
			});
		}
	}
} satisfies Actions;