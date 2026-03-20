import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const InventoryItemCreateSchema = z.object({
	sku: z.string().max(500),
	requires_shipping: z.boolean().optional().default(true),
	metadata: z.record(z.string(), z.any()).optional().default({}),
});

export const load: PageServerLoad = async () => {
	const inventoryItemCreateForm = await superValidate(
		{ sku: '', requires_shipping: undefined },
		zod4(InventoryItemCreateSchema)
	);
	return { inventoryItemCreateForm };
};
	
export const actions = {
	create: async ({ request }) => {
		const inventoryItemCreateForm = await superValidate(request, zod4(InventoryItemCreateSchema));

		if (!inventoryItemCreateForm.valid) {
			return fail(400, { inventoryItemCreateForm });
		}

		const res = await client.inventory.items.post({
			metadata: inventoryItemCreateForm.data.metadata,
			sku: inventoryItemCreateForm.data.sku.trim() || null,
			requires_shipping: inventoryItemCreateForm.data.requires_shipping
		});

		if (res?.error) {
			const err = res.error as { value?: { message?: string } };
			return fail(400, {
				inventoryItemCreateForm,
				error: String(err.value?.message ?? 'Failed to create inventory item')
			});
		}
		
		return message(inventoryItemCreateForm, 'Inventory item created successfully');
	}
} satisfies Actions;
