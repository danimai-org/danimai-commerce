<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Combobox from '$lib/components/organs/combobox/combobox.svelte';
	import { client } from '$lib/client.js';

	type Store = {
		id: string;
		name: string;
		default_currency_code: string | null;
		default_sales_channel_id: string | null;
		default_region_id: string | null;
		default_location_id: string | null;
		metadata: unknown | null;
		created_at: string | Date;
		updated_at: string | Date;
		deleted_at: string | Date | null;
	};

	type Region = { id: string; name: string; currency_code: string };
	type SalesChannel = { id: string; name: string; description: string | null };
	type StockLocation = { id: string; name: string | null };
	type Currency = {
		id: string;
		code: string;
		name: string;
		symbol: string;
		symbol_native: string;
		tax_inclusive_pricing: boolean;
		metadata: unknown | null;
		created_at: string | Date;
		updated_at: string | Date;
		deleted_at: string | Date | null;
	};

	let {
		open = $bindable(false),
		store = null as Store | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		store?: Store | null;
		onSuccess?: () => void;
	} = $props();

	let name = $state('');
	let defaultCurrency = $state('');
	let defaultRegion = $state('');
	let defaultSalesChannel = $state('');
	let defaultLocation = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);

	let regions = $state<Region[]>([]);
	let salesChannels = $state<SalesChannel[]>([]);
	let stockLocations = $state<StockLocation[]>([]);
	let currencies = $state<Currency[]>([]);
	let optionsLoading = $state(false);

	const currencyOptions = $derived(
		currencies.map((c) => ({ id: c.code.toLowerCase(), value: `${c.code.toUpperCase()} - ${c.name}` }))
	);
	const regionOptions = $derived(regions.map((r) => ({ id: r.id, value: r.name })));
	const salesChannelOptions = $derived(salesChannels.map((sc) => ({ id: sc.id, value: sc.name })));
	const locationOptions = $derived(
		stockLocations.map((l) => ({ id: l.id, value: l.name || 'Unnamed location' }))
	);

	$effect(() => {
		if (open && store) {
			name = store.name;
			defaultCurrency = store.default_currency_code?.toLowerCase() ?? '';
			defaultRegion = store.default_region_id ?? '';
			defaultSalesChannel = store.default_sales_channel_id ?? '';
			defaultLocation = store.default_location_id ?? '';
			error = null;
			fetchOptions();
		}
	});

	async function fetchOptions() {
		optionsLoading = true;
		try {
			const [regionsRes, channelsRes, locationsRes, currenciesRes] = await Promise.all([
				client.regions.get({ query: { limit: 100 } as Record<string, unknown> }),
				client['sales-channels'].get({ query: { limit: 100 } as Record<string, unknown> }),
				client['stock-locations'].get({ query: { limit: 100 } as Record<string, unknown> }),
				(client as any).currencies.get({ query: { limit: 100 } })
			]);

			if (regionsRes?.data) {
				regions = ((regionsRes.data as { rows?: Region[] }).rows ?? []) as Region[];
			}
			if (channelsRes?.data) {
				salesChannels = ((channelsRes.data as { rows?: SalesChannel[] }).rows ?? []) as SalesChannel[];
			}
			if (locationsRes?.data) {
				stockLocations = ((locationsRes.data as { rows?: StockLocation[] }).rows ?? []) as StockLocation[];
			}
			if (currenciesRes?.data) {
				currencies = ((currenciesRes.data as { rows?: Currency[] }).rows ?? []) as Currency[];
			}
		} catch (e) {
			console.error('Failed to fetch options:', e);
		} finally {
			optionsLoading = false;
		}
	}

	function close() {
		if (!submitting) {
			open = false;
			error = null;
		}
	}

	async function submit() {
		if (!store) return;
		error = null;
		submitting = true;
		try {
			const body: {
				name?: string;
				default_currency_code?: string | null;
				default_region_id?: string | null;
				default_sales_channel_id?: string | null;
				default_location_id?: string | null;
			} = {};
			if (name.trim() !== store.name) body.name = name.trim();
			if (defaultCurrency !== (store.default_currency_code?.toLowerCase() ?? ''))
				body.default_currency_code = defaultCurrency || null;
			if (defaultRegion !== (store.default_region_id ?? ''))
				body.default_region_id = defaultRegion || null;
			if (defaultSalesChannel !== (store.default_sales_channel_id ?? ''))
				body.default_sales_channel_id = defaultSalesChannel || null;
			if (defaultLocation !== (store.default_location_id ?? ''))
				body.default_location_id = defaultLocation || null;

			const res = await (client as any).stores[":id"].put({
				params: { id: store.id },
				body
			});
			if (res?.error) throw new Error(String(res.error.value?.message ?? 'Failed to update store'));
			open = false;
			onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
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
				{#if error && !submitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error}
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
