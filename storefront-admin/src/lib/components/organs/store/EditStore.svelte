<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Combobox from '$lib/components/organs/combobox/combobox.svelte';
	import type { ComboboxOption } from '$lib/components/organs/combobox/combobox.svelte';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';

	type Store = Awaited<ReturnType<typeof client.stores.get>>['data'];

	let {
		open = $bindable(false),
		store,
		onSuccess = () => {}
	}: {
		open?: boolean;
		store?: Store;
		onSuccess?: () => void;
	} = $props();

	const listQuery = { page: 1, limit: 100 } as const;

	const regionsQuery = createQuery(() => ({
		queryKey: ['edit-store', 'regions', listQuery.page, listQuery.limit],
		queryFn: () => client['regions'].get({ query: listQuery }),
		enabled: open
	}));
	const salesChannelsQuery = createQuery(() => ({
		queryKey: ['edit-store', 'sales-channels', listQuery.page, listQuery.limit],
		queryFn: () => client['sales-channels'].get({ query: listQuery }),
		enabled: open
	}));
	const stockLocationsQuery = createQuery(() => ({
		queryKey: ['edit-store', 'stock-locations', listQuery.page, listQuery.limit],
		queryFn: () => client['stock-locations'].get({ query: listQuery }),
		enabled: open
	}));
	const currenciesQuery = createQuery(() => ({
		queryKey: ['edit-store', 'currencies', listQuery.page, listQuery.limit],
		queryFn: () => client['currencies'].get({ query: listQuery }),
		enabled: open
	}));

	const regionOptions = $derived<ComboboxOption[]>(
		(regionsQuery.data?.data?.rows ?? []).map((r) => ({
			id: r.id,
			value: r.name
		}))
	);
	const salesChannelOptions = $derived<ComboboxOption[]>(
		(salesChannelsQuery.data?.data?.rows ?? []).map((r) => ({
			id: r.id,
			value: r.name
		}))
	);
	const locationOptions = $derived<ComboboxOption[]>(
		(stockLocationsQuery.data?.data?.rows ?? []).map((r) => ({
			id: r.id,
			value: r.name ?? r.id
		}))
	);
	const currencyOptions = $derived<ComboboxOption[]>(
		(currenciesQuery.data?.data?.rows ?? []).map((r) => ({
			id: r.code,
			value: `${r.code} — ${r.name}`
		}))
	);

	const optionsLoading = $derived(
		regionsQuery.isPending ||
			salesChannelsQuery.isPending ||
			stockLocationsQuery.isPending ||
			currenciesQuery.isPending
	);

	let name = $state('');
	let defaultCurrency = $state('');
	let defaultSalesChannel = $state('');
	let defaultRegion = $state('');
	let defaultLocation = $state('');
	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	$effect(() => {
		if (!open) return;
		const s = store;
		if (s) {
			name = s.name;
			defaultCurrency = s.default_currency_code ?? '';
			defaultSalesChannel = s.default_sales_channel_id ?? '';
			defaultRegion = s.default_region_id ?? '';
			defaultLocation = s.default_location_id ?? '';
		} else {
			name = '';
			defaultCurrency = '';
			defaultSalesChannel = '';
			defaultRegion = '';
			defaultLocation = '';
		}
	});

	function close() {
		open = false;
		submitError = null;
	}

	async function submit() {
		submitting = true;
		submitError = null;
		try {
			await client.stores.post({
				name: name.trim() || 'Store',
				default_currency_code: defaultCurrency || undefined,
				default_sales_channel_id: defaultSalesChannel || undefined,
				default_region_id: defaultRegion || undefined,
				default_location_id: defaultLocation || undefined
			});
			open = false;
			onSuccess();
		} catch (e: unknown) {
			submitError = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit store</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update your store's details.</p>
				{#if submitError}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{submitError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-store-name" class="text-sm font-medium">Name</label>
						<Input
							id="edit-store-name"
							type="text"
							bind:value={name}
							placeholder="Store name"
							class="h-9"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-store-currency" class="text-sm font-medium">Default currency</label>
						<Combobox
							id="edit-store-currency"
							options={currencyOptions}
							bind:value={defaultCurrency}
							placeholder="Select currency"
							disabled={optionsLoading}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-store-region" class="text-sm font-medium">Default region</label>
						<Combobox
							id="edit-store-region"
							options={regionOptions}
							bind:value={defaultRegion}
							placeholder="Select region"
							disabled={optionsLoading}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-store-sales-channel" class="text-sm font-medium"
							>Default sales channel</label
						>
						<Combobox
							id="edit-store-sales-channel"
							options={salesChannelOptions}
							bind:value={defaultSalesChannel}
							placeholder="Select sales channel"
							disabled={optionsLoading}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-store-location" class="text-sm font-medium">Default location</label>
						<Combobox
							id="edit-store-location"
							options={locationOptions}
							bind:value={defaultLocation}
							placeholder="Select location"
							disabled={optionsLoading}
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close} disabled={submitting}>Cancel</Button>
				<Button onclick={submit} disabled={submitting || optionsLoading}>
					{submitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
