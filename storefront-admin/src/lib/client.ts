import { getClient } from '@danimai/backend';

const serverUrl = 'http://localhost:8000';

export class Client {
  client: ReturnType<typeof getClient>['admin'];

  constructor(serverUrl: string) {
    this.client = getClient(serverUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).admin;
  }
}

export const client = new Client(serverUrl).client;

export type ReplaceProductVariantsPayload = {
	product_id: string;
	options: Array<{ title: string; values: string[] }>;
	variants: Array<{
		title: string;
		option_values: Array<{ title: string; value: string }>;
		sku?: string;
		manage_inventory?: boolean;
		allow_backorder?: boolean;
		variant_rank?: number;
		prices?: Array<{ amount: number; currency_code: string }>;
	}>;
};

export async function postReplaceProductVariants(payload: ReplaceProductVariantsPayload) {
	const response = await fetch(`${serverUrl}/admin/product-variants`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!response.ok) {
		const errorPayload = (await response.json().catch(() => null)) as
			| { message?: string; summary?: string }
			| null;
		throw new Error(
			errorPayload?.message ?? errorPayload?.summary ?? 'Failed to update options and variants'
		);
	}
	return response.json() as Promise<{ product_id: string; variant_ids: string[] }>;
}

export async function deleteProductVariants(ids: string[]) {
	const response = await fetch(`${serverUrl}/admin/product-variants`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ids })
	});
	if (!response.ok) {
		const errorPayload = (await response.json().catch(() => null)) as
			| { message?: string; summary?: string }
			| null;
		throw new Error(errorPayload?.message ?? errorPayload?.summary ?? 'Failed to delete variants');
	}
}

export async function postProductImages(
  productId: string,
  payload: { files?: File[]; delete_ids?: string[]; type?: string }
) {
  const body = new FormData();
  const files = payload.files ?? [];
  for (const file of files) body.append('files', file);
  if (payload.delete_ids && payload.delete_ids.length > 0) {
    for (const id of payload.delete_ids) body.append('delete_ids', id);
  }
  if (payload.type) body.append('type', payload.type);

  const response = await fetch(`${serverUrl}/admin/products/${productId}/images`, {
    method: 'POST',
    body
  });
  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { message?: string; summary?: string }
      | null;
    throw new Error(
      errorPayload?.message ?? errorPayload?.summary ?? 'Failed to update product images'
    );
  }

  return response;
}
