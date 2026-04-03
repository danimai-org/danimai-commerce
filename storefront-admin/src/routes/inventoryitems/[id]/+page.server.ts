import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const InventoryItemUpdateSchema = z.object({
	id: z.string().min(1),
	sku: z.string(),
	requires_shipping: z.boolean().optional().default(true)
});

export const load: PageServerLoad = async ({ params }) => {
	const inventoryItemUpdateForm = await superValidate(
		{ id: params.id ?? '', sku: '', requires_shipping: true },
		zod4(InventoryItemUpdateSchema)
	);
	return { inventoryItemUpdateForm };
};

export const actions = {
	update: async ({ request, params }) => {
		const inventoryItemUpdateForm = await superValidate(request, zod4(InventoryItemUpdateSchema));
		if (!inventoryItemUpdateForm.valid) {
			return fail(400, { inventoryItemUpdateForm });
		}
		if (inventoryItemUpdateForm.data.id !== params.id) {
			return fail(400, {
				inventoryItemUpdateForm,
				error: 'Invalid inventory item'
			});
		}
		const trimmed = inventoryItemUpdateForm.data.sku.trim();
		const res = await client.inventory.items({ id: inventoryItemUpdateForm.data.id }).put({
			sku: trimmed === '' ? null : trimmed,
			requires_shipping: inventoryItemUpdateForm.data.requires_shipping
		});
		if (res?.error) {
			const err = res.error as { value?: { message?: string } };
			return fail(400, {
				inventoryItemUpdateForm,
				error: String(err.value?.message ?? 'Failed to update inventory item')
			});
		}
		return message(inventoryItemUpdateForm, 'Inventory item updated successfully');
	}
} satisfies Actions;
