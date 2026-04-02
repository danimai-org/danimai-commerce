import type { client } from '$lib/client';

export type InventoryItem = Awaited<
	ReturnType<ReturnType<(typeof client)['inventory']['items']>['get']>
>['data'];

export type InventoryItemEntity = {
	id: string;
	sku: string | null;
	requires_shipping: boolean;
	metadata: unknown | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type InventoryLevelEntity = {
	id: string;
	inventory_item_id: string;
	location_id: string;
	stocked_quantity: number;
	reserved_quantity: number;
	available_quantity: number;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type ReservationItemEntity = {
	id: string;
	inventory_item_id: string;
	location_id: string;
	quantity: number;
	line_item_id: string | null;
	description: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type ProductVariantSummary = {
	id: string;
	title: string;
	sku: string | null;
	product_id: string | null;
	thumbnail?: string | null;
};

export type ProductSummaryFromApi = {
	id: string;
	title: string | null;
	thumbnail: string | null;
};

export type InventoryLevelWithLocation = InventoryLevelEntity & {
	location?: { id: string; name: string | null } | null;
};

export type InventoryItemDetailData = {
	item: InventoryItemEntity;
	levels: InventoryLevelWithLocation[];
	reservations: ReservationItemEntity[];
	associated_variants?: ProductVariantSummary[];
	product_summaries?: Record<string, ProductSummaryFromApi>;
};
