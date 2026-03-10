import { createQuery } from '@tanstack/svelte-query';
import { client } from '$lib/client';
import type { Product } from '$lib/products/types';
import type { ProductCategory } from '$lib/product-categories/types';
import type { ProductCollection } from '$lib/product-collection/types';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

export type ProductDetail = Product & {
	metadata?: Record<string, unknown>;
	attributes?: Array<{ id: string; title: string; value?: string }>;
	discountable?: boolean;
	collection_ids?: string[];
	tag_ids?: string[];
	collections?: ProductCollection[];
	tags?: Array<{ id: string; value: string }>;
	attribute_group_id?: string | null;
};

export type SalesChannel = {
	id: string;
	name: string;
	is_default?: boolean;
};

export type ProductVariant = {
	id: string;
	title: string;
	sku: string | null;
	product_id: string | null;
	thumbnail?: string | null;
	manage_inventory: boolean;
	allow_backorder?: boolean;
	ean?: string | null;
	upc?: string | null;
	barcode?: string | null;
	created_at?: string;
	updated_at?: string;
};

export type ProductOption = {
	id: string;
	title: string;
	product_id: string | null;
};

function parseSalesChannelsResponse(raw: unknown): SalesChannel[] {
	if (Array.isArray(raw)) return raw as SalesChannel[];
	if (raw && typeof raw === 'object') {
		const o = raw as Record<string, unknown>;
		if (Array.isArray(o.rows)) return o.rows as SalesChannel[];
		if (Array.isArray(o.data)) return o.data as SalesChannel[];
		if (Array.isArray(o.sales_channels)) return o.sales_channels as SalesChannel[];
		if (Array.isArray(o.channels)) return o.channels as SalesChannel[];
	}
	return [];
}

export function useProductDetail(getProductId: () => string) {
	const productId = $derived(getProductId());

	const productDetailQuery = createQuery(() => ({
		queryKey: ['product-detail', productId],
		queryFn: async () => {
			const id = productId;
			if (!id) return null;
			const res = await client.products({ id }).get();
			return res.data;
		},
		enabled: !!productId
	}));

	const product = $derived((productDetailQuery.data ?? null) as ProductDetail | null);
	const loading = $derived(productDetailQuery.isPending);
	const productError = $derived(
		productDetailQuery.error != null
			? productDetailQuery.error instanceof Error
				? productDetailQuery.error.message
				: String(productDetailQuery.error)
			: null
	);
	const error = $derived(productError);

	let variants = $state<ProductVariant[]>([]);
	let options = $state<ProductOption[]>([]);
	let category = $state<ProductCategory | null>(null);
	let allSalesChannels = $state<SalesChannel[]>([]);
	let productSalesChannelIds = $state<Set<string>>(new Set());

	async function loadProduct() {
		await productDetailQuery.refetch();
	}

	async function loadOptionsAndVariants() {
		const id = product?.id;
		if (!id) return;
		try {
			const [optRes, varRes] = await Promise.all([
				fetch(`${API_BASE}/product-options?product_id=${id}&limit=100`, { cache: 'no-store' }),
				fetch(`${API_BASE}/product-variants?product_id=${id}&limit=100`, { cache: 'no-store' })
			]);
			const optJson = optRes.ok ? ((await optRes.json()) as { rows?: ProductOption[] }) : null;
			const varJson = varRes.ok ? ((await varRes.json()) as { rows?: ProductVariant[] }) : null;
			options = optJson?.rows ?? [];
			variants = varJson?.rows ?? [];
		} catch {
			variants = [];
			options = [];
		}
	}

	async function loadCategory() {
		if (!product?.category_id) {
			category = null;
			return;
		}
		try {
			const res = await fetch(`${API_BASE}/product-categories?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as { rows?: ProductCategory[] };
				category = (j.rows ?? []).find((c) => c.id === product!.category_id) ?? null;
			} else {
				category = null;
			}
		} catch {
			category = null;
		}
	}

	async function fetchSalesChannels() {
		try {
			const res = await fetch(`${API_BASE}/sales-channels?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const raw = await res.json();
				allSalesChannels = parseSalesChannelsResponse(raw);
			} else {
				allSalesChannels = [];
			}
		} catch {
			allSalesChannels = [];
		}
	}

	async function refetchProductSalesChannels() {
		if (!productId) return;
		try {
			const res = await fetch(
				`${API_BASE}/sales-channels/products/${productId}/sales-channels`,
				{ cache: 'no-store' }
			);
			if (res.ok) {
				const raw = await res.json();
				productSalesChannelIds = new Set(parseSalesChannelsResponse(raw).map((ch) => ch.id));
			} else {
				productSalesChannelIds = new Set();
			}
		} catch {
			productSalesChannelIds = new Set();
		}
	}

	function setProductSalesChannelIds(set: Set<string>) {
		productSalesChannelIds = set;
	}

	async function updateProductSalesChannels(selectedIds: Set<string>) {
		if (!productId) return;
		const salesChannelIds = Array.from(selectedIds);
		const res = await fetch(
			`${API_BASE}/sales-channels/products/${productId}/sales-channels`,
			{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sales_channel_ids: salesChannelIds })
			}
		);
		if (!res.ok) {
			const text = await res.text();
			let message = text;
			try {
				const parsed = JSON.parse(text) as { message?: string; error?: string };
				message = parsed.message || parsed.error || text;
			} catch {
				// ignore
			}
			throw new Error(message || 'Failed to update sales channels');
		}
		await refetchProductSalesChannels();
	}

	$effect(() => {
		if (product?.id) {
			loadOptionsAndVariants();
			refetchProductSalesChannels();
			fetchSalesChannels();
		} else {
			options = [];
			variants = [];
		}
	});

	$effect(() => {
		if (product?.category_id) {
			loadCategory();
		} else {
			category = null;
		}
	});

	return {
		product,
		loading,
		error,
		category,
		options,
		variants,
		allSalesChannels,
		productSalesChannelIds,
		setProductSalesChannelIds,
		loadProduct,
		loadCategory,
		loadOptionsAndVariants,
		refetchProductSalesChannels,
		updateProductSalesChannels
	};
}
