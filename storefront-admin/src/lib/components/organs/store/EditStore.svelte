<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Combobox from '$lib/components/organs/combobox/combobox.svelte';
	import type { ComboboxOption } from '$lib/components/organs/combobox/combobox.svelte';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { superForm } from 'sveltekit-superforms/client';
	import type { PageData } from '../../../../routes/store/$types';
	import { cn } from '$lib/utils.js';

	type Store = Awaited<ReturnType<typeof client.stores.get>>['data'];
	type StoreUpdateForm = PageData['storeUpdateForm'];

	let {
		open = $bindable(false),
		storeUpdateForm,
		store,
		onSuccess = () => {}
	}: {
		open?: boolean;
		storeUpdateForm: StoreUpdateForm;
		store?: Store;
		onSuccess?: () => void;
	} = $props();

	const listQuery = { page: 1, limit: 200 } as const;
	const DEBOUNCE_MS = 400;

	let currencySearch = $state('');
	let debouncedCurrencySearch = $state('');
	let regionSearch = $state('');
	let debouncedRegionSearch = $state('');
	let salesChannelSearch = $state('');
	let debouncedSalesChannelSearch = $state('');
	let stockLocationSearch = $state('');
	let debouncedStockLocationSearch = $state('');

	function debouncedLane(
		live: () => string,
		debounced: () => string,
		setDebounced: (v: string) => void
	) {
		const q = live();
		if (debounced() === q) return;
		const t = setTimeout(() => setDebounced(q), DEBOUNCE_MS);
		return () => clearTimeout(t);
	}

	$effect(() =>
		debouncedLane(() => currencySearch, () => debouncedCurrencySearch, (v) => (debouncedCurrencySearch = v))
	);
	$effect(() =>
		debouncedLane(() => regionSearch, () => debouncedRegionSearch, (v) => (debouncedRegionSearch = v))
	);
	$effect(() =>
		debouncedLane(
			() => salesChannelSearch,
			() => debouncedSalesChannelSearch,
			(v) => (debouncedSalesChannelSearch = v)
		)
	);
	$effect(() =>
		debouncedLane(
			() => stockLocationSearch,
			() => debouncedStockLocationSearch,
			(v) => (debouncedStockLocationSearch = v)
		)
	);

	const currencyStale = $derived(currencySearch.trim() !== debouncedCurrencySearch.trim());
	const regionStale = $derived(regionSearch.trim() !== debouncedRegionSearch.trim());
	const salesChannelStale = $derived(
		salesChannelSearch.trim() !== debouncedSalesChannelSearch.trim()
	);
	const stockLocationStale = $derived(
		stockLocationSearch.trim() !== debouncedStockLocationSearch.trim()
	);

	const currencyDebouncedTrim = $derived(debouncedCurrencySearch.trim());
	const regionDebouncedTrim = $derived(debouncedRegionSearch.trim());
	const salesChannelDebouncedTrim = $derived(debouncedSalesChannelSearch.trim());
	const stockLocationDebouncedTrim = $derived(debouncedStockLocationSearch.trim());

	let currencyOpenAwaitFetch = $state(false);
	let regionOpenAwaitFetch = $state(false);
	let salesChannelOpenAwaitFetch = $state(false);
	let stockLocationOpenAwaitFetch = $state(false);

	let currencyOpenSeq = 0;
	let regionOpenSeq = 0;
	let salesChannelOpenSeq = 0;
	let stockLocationOpenSeq = 0;

	let currencyOpenRafId = 0;
	let regionOpenRafId = 0;
	let salesChannelOpenRafId = 0;
	let stockLocationOpenRafId = 0;

	function cancelCurrencyCombRaf() {
		if (currencyOpenRafId) cancelAnimationFrame(currencyOpenRafId);
		currencyOpenRafId = 0;
	}
	function cancelRegionCombRaf() {
		if (regionOpenRafId) cancelAnimationFrame(regionOpenRafId);
		regionOpenRafId = 0;
	}
	function cancelSalesChannelCombRaf() {
		if (salesChannelOpenRafId) cancelAnimationFrame(salesChannelOpenRafId);
		salesChannelOpenRafId = 0;
	}
	function cancelStockLocationCombRaf() {
		if (stockLocationOpenRafId) cancelAnimationFrame(stockLocationOpenRafId);
		stockLocationOpenRafId = 0;
	}

	function resetComboboxOpenFetchers() {
		currencyOpenSeq++;
		regionOpenSeq++;
		salesChannelOpenSeq++;
		stockLocationOpenSeq++;
		cancelCurrencyCombRaf();
		cancelRegionCombRaf();
		cancelSalesChannelCombRaf();
		cancelStockLocationCombRaf();
		currencyOpenAwaitFetch = false;
		regionOpenAwaitFetch = false;
		salesChannelOpenAwaitFetch = false;
		stockLocationOpenAwaitFetch = false;
	}

	$effect(() => {
		if (!open) {
			currencySearch = '';
			debouncedCurrencySearch = '';
			regionSearch = '';
			debouncedRegionSearch = '';
			salesChannelSearch = '';
			debouncedSalesChannelSearch = '';
			stockLocationSearch = '';
			debouncedStockLocationSearch = '';
			resetComboboxOpenFetchers();
		}
	});

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, delayed, reset, message } = superForm(storeUpdateForm, {
		id: 'edit-store-form',
		resetForm: false,
		invalidateAll: 'force',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				open = false;
				onSuccess();
				return;
			}
			if (result.type === 'failure') {
				const d = result.data as { error?: string } | undefined;
				if (d?.error) message.set(d.error);
			}
		}
	});

	const regionsQuery = createQuery(() => ({
		queryKey: ['edit-store', 'regions', 'v2', open, regionDebouncedTrim, listQuery.page, listQuery.limit],
		queryFn: ({ signal }) =>
			client['regions'].get({
				query: {
					page: listQuery.page,
					limit: listQuery.limit,
					...(regionDebouncedTrim ? { search: regionDebouncedTrim } : {})
				},
				...(signal ? { fetch: { signal } } : {})
			}),
		enabled: open,
		refetchOnWindowFocus: false
	}));
	const salesChannelsQuery = createQuery(() => ({
		queryKey: [
			'edit-store',
			'sales-channels',
			'v2',
			open,
			salesChannelDebouncedTrim,
			listQuery.page,
			listQuery.limit
		],
		queryFn: ({ signal }) =>
			client['sales-channels'].get({
				query: {
					page: listQuery.page,
					limit: listQuery.limit,
					...(salesChannelDebouncedTrim ? { search: salesChannelDebouncedTrim } : {})
				},
				...(signal ? { fetch: { signal } } : {})
			}),
		enabled: open,
		refetchOnWindowFocus: false
	}));
	const stockLocationsQuery = createQuery(() => ({
		queryKey: [
			'edit-store',
			'stock-locations',
			'v2',
			open,
			stockLocationDebouncedTrim,
			listQuery.page,
			listQuery.limit
		],
		queryFn: ({ signal }) =>
			client['stock-locations'].get({
				query: {
					page: listQuery.page,
					limit: listQuery.limit,
					...(stockLocationDebouncedTrim ? { search: stockLocationDebouncedTrim } : {})
				},
				...(signal ? { fetch: { signal } } : {})
			}),
		enabled: open,
		refetchOnWindowFocus: false
	}));
	const currenciesQuery = createQuery(() => ({
		queryKey: ['edit-store', 'currencies-available', open, currencyDebouncedTrim, listQuery.page, listQuery.limit],
		queryFn: async ({ signal }) => {
			const res = await client.currencies.available.get({
				query: {
					page: listQuery.page,
					limit: listQuery.limit,
					...(currencyDebouncedTrim ? { search: currencyDebouncedTrim } : {})
				},
				...(signal ? { fetch: { signal } } : {})
			});
			if (res.error != null) throw res.error;
			return res.data;
		},
		enabled: open,
		refetchOnWindowFocus: false
	}));

	const currencies = $derived(currenciesQuery.data?.data ?? []);

	function withSelectedFallback(mapped: ComboboxOption[], selectedId: string): ComboboxOption[] {
		const id = selectedId.trim();
		if (!id || mapped.some((o) => o.id === id)) return mapped;
		return [{ id, value: id }, ...mapped];
	}

	const passthroughOpts = (opts: ComboboxOption[]): ComboboxOption[] => opts;

	const regionOptions = $derived.by((): ComboboxOption[] =>
		withSelectedFallback(
			(regionsQuery.data?.data?.rows ?? []).map((r) => ({
				id: r.id,
				value: r.name || r.id
			})),
			$form.default_region_id ?? ''
		)
	);
	const salesChannelOptions = $derived.by((): ComboboxOption[] =>
		withSelectedFallback(
			(salesChannelsQuery.data?.data?.rows ?? []).map((r) => ({
				id: r.id,
				value: r.name
			})),
			$form.default_sales_channel_id ?? ''
		)
	);
	const locationOptions = $derived.by((): ComboboxOption[] =>
		withSelectedFallback(
			(stockLocationsQuery.data?.data?.rows ?? []).map((r) => ({
				id: r.id,
				value: r.name ?? r.id
			})),
			$form.default_location_id ?? ''
		)
	);
	function formatCurrencyLabel(c: { name: string; code: string; symbol: string }) {
		const code = String(c.code).toUpperCase();
		const symbol = String(c.symbol);
		if (symbol && symbol !== code) return `${c.name} (${code} ${symbol})`;
		return `${c.name} (${code})`;
	}

	const currencyOptions = $derived.by((): ComboboxOption[] =>
		withSelectedFallback(
			currencies.map((row) => ({
				id: String(row.code),
				value: formatCurrencyLabel({
					name: String(row.name),
					code: String(row.code),
					symbol: String(row.symbol)
				})
			})),
			$form.default_currency_code ?? ''
		)
	);

	const currencyComboboxLoading = $derived(
		currencyStale || currenciesQuery.isFetching || currencyOpenAwaitFetch
	);
	const regionComboboxLoading = $derived(regionStale || regionsQuery.isFetching || regionOpenAwaitFetch);
	const salesChannelComboboxLoading = $derived(
		salesChannelStale || salesChannelsQuery.isFetching || salesChannelOpenAwaitFetch
	);
	const stockLocationComboboxLoading = $derived(
		stockLocationStale || stockLocationsQuery.isFetching || stockLocationOpenAwaitFetch
	);

	function onCurrencyOpenChange(opened: boolean) {
		if (opened) {
			cancelCurrencyCombRaf();
			currencyOpenAwaitFetch = true;
			const id = ++currencyOpenSeq;
			currencyOpenRafId = requestAnimationFrame(() => {
				currencyOpenRafId = 0;
				void currenciesQuery.refetch().finally(() => {
					if (id === currencyOpenSeq) currencyOpenAwaitFetch = false;
				});
			});
		} else {
			currencyOpenSeq++;
			cancelCurrencyCombRaf();
			currencyOpenAwaitFetch = false;
		}
	}

	function onRegionOpenChange(opened: boolean) {
		if (opened) {
			cancelRegionCombRaf();
			regionOpenAwaitFetch = true;
			const id = ++regionOpenSeq;
			regionOpenRafId = requestAnimationFrame(() => {
				regionOpenRafId = 0;
				void regionsQuery.refetch().finally(() => {
					if (id === regionOpenSeq) regionOpenAwaitFetch = false;
				});
			});
		} else {
			regionOpenSeq++;
			cancelRegionCombRaf();
			regionOpenAwaitFetch = false;
		}
	}

	function onSalesChannelOpenChange(opened: boolean) {
		if (opened) {
			cancelSalesChannelCombRaf();
			salesChannelOpenAwaitFetch = true;
			const id = ++salesChannelOpenSeq;
			salesChannelOpenRafId = requestAnimationFrame(() => {
				salesChannelOpenRafId = 0;
				void salesChannelsQuery.refetch().finally(() => {
					if (id === salesChannelOpenSeq) salesChannelOpenAwaitFetch = false;
				});
			});
		} else {
			salesChannelOpenSeq++;
			cancelSalesChannelCombRaf();
			salesChannelOpenAwaitFetch = false;
		}
	}

	function onStockLocationOpenChange(opened: boolean) {
		if (opened) {
			cancelStockLocationCombRaf();
			stockLocationOpenAwaitFetch = true;
			const id = ++stockLocationOpenSeq;
			stockLocationOpenRafId = requestAnimationFrame(() => {
				stockLocationOpenRafId = 0;
				void stockLocationsQuery.refetch().finally(() => {
					if (id === stockLocationOpenSeq) stockLocationOpenAwaitFetch = false;
				});
			});
		} else {
			stockLocationOpenSeq++;
			cancelStockLocationCombRaf();
			stockLocationOpenAwaitFetch = false;
		}
	}

	$effect(() => {
		if (!open) return;
		const s = store;
		if (s) {
			reset({
				data: {
					id: s.id,
					name: s.name,
					default_currency_code: s.default_currency_code ?? '',
					default_sales_channel_id: s.default_sales_channel_id ?? '',
					default_region_id: s.default_region_id ?? '',
					default_location_id: s.default_location_id ?? ''
				}
			});
		} else {
			reset({
				data: {
					id: '',
					name: '',
					default_currency_code: '',
					default_sales_channel_id: '',
					default_region_id: '',
					default_location_id: ''
				}
			});
		}
		message.set('');
	});

	function close() {
		open = false;
		message.set('');
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form method="POST" action="?/updateStore" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" value={$form.id ?? ''} />
			<input type="hidden" name="default_currency_code" value={$form.default_currency_code} />
			<input type="hidden" name="default_sales_channel_id" value={$form.default_sales_channel_id} />
			<input type="hidden" name="default_region_id" value={$form.default_region_id} />
			<input type="hidden" name="default_location_id" value={$form.default_location_id} />

			<div class="flex h-full flex-col">
				<div class="flex-1 overflow-auto p-6 pt-12">
					<h2 class="text-lg font-semibold">Edit store</h2>
					<p class="mt-1 text-sm text-muted-foreground">Update your store's details.</p>
					{#if $message}
						<div
							class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{$message}
						</div>
					{/if}
					<div class="mt-6 flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-store-name" class="text-sm font-medium">Name</label>
							<Input
								id="edit-store-name"
								name="name"
								type="text"
								bind:value={$form.name}
								placeholder="Store name"
								aria-invalid={$errors.name ? 'true' : undefined}
								class={cn('h-9', $errors.name && 'border-destructive')}
							/>
							{#if $errors.name}
								<span class="text-xs text-destructive">{$errors.name}</span>
							{/if}
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-store-currency" class="text-sm font-medium">Default currency</label>
							<Combobox
								id="edit-store-currency"
								options={currencyOptions}
								bind:value={$form.default_currency_code}
								placeholder="Select currency"
								loading={currencyComboboxLoading}
								emptyMessage="No currencies match your search."
								filterFn={passthroughOpts}
								onSearchChange={(v) => (currencySearch = v)}
								onOpenChange={onCurrencyOpenChange}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-store-region" class="text-sm font-medium">Default region</label>
							<Combobox
								id="edit-store-region"
								options={regionOptions}
								bind:value={$form.default_region_id}
								placeholder="Select region"
								loading={regionComboboxLoading}
								emptyMessage="No regions match your search."
								filterFn={passthroughOpts}
								onSearchChange={(v) => (regionSearch = v)}
								onOpenChange={onRegionOpenChange}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-store-sales-channel" class="text-sm font-medium"
								>Default sales channel</label
							>
							<Combobox
								id="edit-store-sales-channel"
								options={salesChannelOptions}
								bind:value={$form.default_sales_channel_id}
								placeholder="Select sales channel"
								loading={salesChannelComboboxLoading}
								emptyMessage="No sales channels match your search."
								filterFn={passthroughOpts}
								onSearchChange={(v) => (salesChannelSearch = v)}
								onOpenChange={onSalesChannelOpenChange}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-store-location" class="text-sm font-medium">Default location</label>
							<Combobox
								id="edit-store-location"
								options={locationOptions}
								bind:value={$form.default_location_id}
								placeholder="Select location"
								loading={stockLocationComboboxLoading}
								emptyMessage="No locations match your search."
								filterFn={passthroughOpts}
								onSearchChange={(v) => (stockLocationSearch = v)}
								onOpenChange={onStockLocationOpenChange}
							/>
						</div>
					</div>
				</div>
				<div class="flex justify-end gap-2 border-t p-4">
					<Button type="button" variant="outline" onclick={close} disabled={$delayed}>Cancel</Button>
					<Button type="submit" disabled={$delayed}>
						{$delayed ? 'Saving…' : 'Save'}
					</Button>
				</div>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
