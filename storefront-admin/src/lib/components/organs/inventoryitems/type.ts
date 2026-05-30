import { client, type DetailById, type PaginatedRow } from '$lib/client';

type InventoryItemsClient = (typeof client)['inventory']['items'];

export type InventoryItemListRow = PaginatedRow<typeof client.inventory.items.get>;

export type InventoryItemEntity = DetailById<InventoryItemsClient>;

export type InventoryLevelEntity = PaginatedRow<typeof client.inventory.levels.get>;

export type ReservationItemEntity = NonNullable<
	NonNullable<InventoryItemEntity['reservation_items']>
>[number];

export type ProductVariantSummary = PaginatedRow<(typeof client)['product-variants']['get']>;

export type ProductSummaryFromApi = Pick<
	PaginatedRow<typeof client.products.get>,
	'id' | 'title' | 'thumbnail'
>;

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

/** @deprecated Use InventoryItemListRow */
export type InventoryItem = DetailById<InventoryItemsClient>;
