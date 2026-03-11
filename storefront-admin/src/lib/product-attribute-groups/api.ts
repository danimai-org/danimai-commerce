import type {
	ProductAttributeGroup,
	ProductAttributeGroupDetail,
	AttributeGroupsResponse,
	ListAttributeGroupsParams,
	PaginationMeta
} from './types.js';
import { client } from '$lib/client.js';

export async function getAttributeGroup(id: string): Promise<ProductAttributeGroupDetail | null> {
	const res = await client['product-attribute-groups']({ id }).get();
	if (res.error) {
		// Treat 404-like errors as null when possible; otherwise, surface the error.
		const message = String(res.error);
		if (message.toLowerCase().includes('not found') || message.includes('404')) {
			return null;
		}
		throw new Error(message);
	}
	if (!res.data) return null;
	return res.data as ProductAttributeGroupDetail;
}

export async function updateAttributeGroup(
	id: string,
	body: { title?: string; attribute_ids?: string[] }
): Promise<ProductAttributeGroupDetail> {
	const res = await client['product-attribute-groups']({ id }).put(body);
	if (res.error) {
		throw new Error(String(res.error));
	}
	return res.data as ProductAttributeGroupDetail;
}

export async function listAttributeGroups(
	params: ListAttributeGroupsParams
): Promise<AttributeGroupsResponse> {
	const res = await client['product-attribute-groups']().get({
		query: {
			page: params.page,
			limit: params.limit,
			sorting_field: params.sorting_field,
			sorting_direction: params.sorting_direction
		}
	});
	if (res.error) {
		throw new Error(String(res.error));
	}

	const rows = (res.data?.rows ?? []) as ProductAttributeGroup[];
	const pagination: PaginationMeta = (res.data?.pagination as PaginationMeta | undefined) ?? {
		total: rows.length,
		page: 1,
		limit: 10,
		total_pages: 1,
		has_next_page: false,
		has_previous_page: false
	};

	return {
		data: { rows, pagination },
		pagination
	};
}

export async function deleteAttributeGroups(ids: string[]): Promise<void> {
	const res = await (client as any)['product-attribute-groups']().delete({
		attribute_group_ids: ids
	});
	if (res?.error) {
		throw new Error(String(res.error));
	}
}
