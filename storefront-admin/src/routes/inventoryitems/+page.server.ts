import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const InventoryItemCreateSchema = z.object({
	sku: z.string().min(4, 'SKU must be at least 4 characters'),
	requires_shipping: z.boolean().optional().default(true),
	metadata: z.record(z.string(), z.any()).optional().default({})
});
const DeleteInventoryItemsSchema = z.object({
	ids: z.array(z.string()).min(1, 'At least one inventory item must be selected')
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
			sku: inventoryItemCreateForm.data.sku.trim(),
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
	},
	delete: async ({ request }) => {
		const inventoryItemDeleteForm = await superValidate(request, zod4(DeleteInventoryItemsSchema));
		if (!inventoryItemDeleteForm.valid) {
			return fail(400, { inventoryItemDeleteForm });
		}
		const res = await client.inventory.items.delete({ ids: inventoryItemDeleteForm.data.ids });
		if (res?.error) {
			return fail(400, { inventoryItemDeleteForm });
		}
		return message(inventoryItemDeleteForm, 'Inventory items deleted successfully');
	}
} satisfies Actions;
