import { z } from 'zod';
import type { SuperValidated } from 'sveltekit-superforms';

const idJsonArray = (label: string) =>
	z.preprocess(
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
		z.array(z.string().uuid(`${label} ID must be a valid UUID`))
	);

export const ProductUpdateSchema = z.object({
	id: z.union([z.string().uuid(), z.literal('')]).default(''),
	status: z.enum(['draft', 'proposed', 'published', 'rejected']).default('draft'),
	title: z
		.string()
		.min(3, 'Title must be at least 3 characters')
		.max(255, 'Title is too long')
		.default(''),
	subtitle: z.string().max(255, 'Subtitle is too long').default(''),
	handle: z.string().max(255, 'Handle is too long').default(''),
	description: z.string().max(4000, 'Description is too long').default(''),
	discountable: z.preprocess(
		(v) => (v === undefined || v === '' ? true : v === true || v === 'true'),
		z.boolean().default(true)
	),
	category_id: z.union([z.string().uuid(), z.literal('')]).default(''),
	collection_ids: idJsonArray('Collection').default([]),
	tag_ids: idJsonArray('Tag').default([]),
	attributes: z
		.array(
			z.object({
				attribute_id: z.string().uuid(),
				value: z.string().default('')
			})
		)
		.default([])
});

export const ProductVariantUpdateSchema = z.object({
	id: z.union([z.string().uuid(), z.literal('')]).default(''),
	title: z.string().default(''),
	material: z.string().default(''),
	sku: z.string().default(''),
	ean: z.string().default(''),
	upc: z.string().default(''),
	barcode: z.string().default(''),
	price_amount: z.string().default(''),
	option_values_json: z.string().default('{}'),
	manage_inventory: z.preprocess(
		(v) => (v === undefined || v === '' ? true : v === true || v === 'true'),
		z.boolean().default(true)
	)
});

export type ProductUpdateFormData = z.infer<typeof ProductUpdateSchema>;
export type ProductVariantUpdateFormData = z.infer<typeof ProductVariantUpdateSchema>;

export type ProductDetailPageData = {
	productUpdateForm: SuperValidated<ProductUpdateFormData>;
	productVariantUpdateForm: SuperValidated<ProductVariantUpdateFormData>;
};

export const defaultProductVariantUpdateFormData: ProductVariantUpdateFormData = {
	id: '',
	title: '',
	material: '',
	sku: '',
	ean: '',
	upc: '',
	barcode: '',
	price_amount: '',
	option_values_json: '{}',
	manage_inventory: true
};
