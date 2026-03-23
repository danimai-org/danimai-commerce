import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const StockLocationFormSchema = z.object({
	id: z.string().optional().default(''),
	name: z.string().max(500).optional().default(''),
	address_1: z.string().optional().default(''),
	address_2: z.string().optional().default(''),
	company: z.string().optional().default(''),
	city: z.string().optional().default(''),
	province: z.string().optional().default(''),
	postal_code: z.string().optional().default(''),
	country_code: z.string().optional().default(''),
	phone: z.string().optional().default('')
});

function addressFromForm(data: z.infer<typeof StockLocationFormSchema>) {
	const addressFields = {
		address_1: data.address_1.trim() || null,
		address_2: data.address_2.trim() || null,
		company: data.company.trim() || null,
		city: data.city.trim() || null,
		province: data.province.trim() || null,
		postal_code: data.postal_code.trim() || null,
		country_code: data.country_code.trim() || null,
		phone: data.phone.trim() || null
	};
	const hasAddress = Object.values(addressFields).some((v) => v != null && v !== '');
	return hasAddress ? addressFields : undefined;
}

type LocationAddress = {
	address_1?: string | null;
	address_2?: string | null;
	company?: string | null;
	city?: string | null;
	province?: string | null;
	postal_code?: string | null;
	country_code?: string | null;
	phone?: string | null;
};

type LoadedLocation = {
	id: string;
	name: string | null;
	address?: LocationAddress | null;
};

export const load: PageServerLoad = async ({ params }) => {
	const id = params.id;
	if (!id) {
		error(404, { message: 'Not found' });
	}
	const res = await client['stock-locations']({ id }).get();
	if (res?.error) {
		const err = res.error as { status?: number; value?: { message?: string } };
		if (err.status === 404) {
			error(404, { message: 'Location not found' });
		}
		error(500, { message: String(err.value?.message ?? 'Failed to load location') });
	}
	const loc = res?.data as LoadedLocation | null | undefined;
	if (!loc) {
		error(404, { message: 'Location not found' });
	}
	const addr = loc.address;
	const formData = {
		id: loc.id,
		name: loc.name ?? '',
		address_1: addr?.address_1 ?? '',
		address_2: addr?.address_2 ?? '',
		company: addr?.company ?? '',
		city: addr?.city ?? '',
		province: addr?.province ?? '',
		postal_code: addr?.postal_code ?? '',
		country_code: addr?.country_code ?? '',
		phone: addr?.phone ?? ''
	};
	const stockLocationForm = await superValidate(formData, zod4(StockLocationFormSchema));
	// Load data must be JSON-serializable (omit Date fields from API row).
	return {
		stockLocationForm,
		location: {
			id: loc.id,
			name: loc.name,
			address: addr ?? null
		} satisfies LoadedLocation
	};
};

export const actions = {
	update: async ({ request }) => {
		const stockLocationForm = await superValidate(request, zod4(StockLocationFormSchema));
		if (!stockLocationForm.valid) {
			return fail(400, { stockLocationForm });
		}
		const id = stockLocationForm.data.id.trim();
		if (!id) {
			return fail(400, {
				stockLocationForm,
				error: 'Missing location id'
			});
		}
		const addr = addressFromForm(stockLocationForm.data);
		const updateRes = await client['stock-locations']({ id }).put({
			name: stockLocationForm.data.name.trim() || null,
			...(addr !== undefined ? { address: addr } : {})
		});
		if (updateRes?.error) {
			const err = updateRes.error as { value?: { message?: string } };
			return fail(400, {
				stockLocationForm,
				error: String(err.value?.message ?? 'Failed to update stock location')
			});
		}
		return message(stockLocationForm, 'Location updated successfully');
	}
} satisfies Actions;
