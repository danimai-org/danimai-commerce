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

export async function postProductImages(
	productId: string,
	payload: { files?: File[]; delete_ids?: string[]; type?: string }
) {
	const body = new FormData();
	const files = payload.files ?? [];
	if (files.length === 1) {
		body.append('files', files[0]);
	} else if (files.length > 1) {
		for (const file of files) body.append('files[]', file);
	}
	if (payload.delete_ids && payload.delete_ids.length > 0) {
		for (const id of payload.delete_ids) body.append('delete_ids[]', id);
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
