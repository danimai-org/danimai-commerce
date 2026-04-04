<script lang="ts">
	import EditStore from '$lib/components/organs/store/EditStore.svelte';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';
	import type { PageData } from '../../../../routes/store/$types';
	import Loader from '@lucide/svelte/icons/loader';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { DropdownMenu } from 'bits-ui';
	import { Button } from '$lib/components/ui/button/index.js';

	const listQuery = { page: 1, limit: 100 } as const;

	type StoreUpdateForm = PageData['storeUpdateForm'];

	let { storeUpdateForm }: { storeUpdateForm: StoreUpdateForm } = $props();

	const storesQuery = createQuery(() => ({
		queryKey: ['store'],
		queryFn: () => client.stores.get()
	}));

	let editStoreOpen = $state(false);

	const store = $derived(storesQuery.data?.data ?? null);
	const loading = $derived(storesQuery.isPending);
	const error = $derived(storesQuery.error);

	const errorMessage = $derived(
		error == null ? null : error instanceof Error ? error.message : String(error)
	);

	const lookupsEnabled = $derived(!!store && !loading && !errorMessage);

	const currenciesQuery = createQuery(() => ({
		queryKey: ['store-listing-card', 'currencies', listQuery.page, listQuery.limit],
		queryFn: () => client['currencies'].get({ query: listQuery }),
		enabled: lookupsEnabled
	}));
	const regionsQuery = createQuery(() => ({
		queryKey: ['store-listing-card', 'regions', listQuery.page, listQuery.limit],
		queryFn: () => client['regions'].get({ query: listQuery }),
		enabled: lookupsEnabled
	}));
	const defaultRegionQuery = createQuery(() => ({
		queryKey: ['store-listing-card', 'region', store?.default_region_id ?? null],
		queryFn: () => client['regions']({ id: store!.default_region_id! }).get(),
		enabled: lookupsEnabled && !!store?.default_region_id
	}));
	const salesChannelsQuery = createQuery(() => ({
		queryKey: ['store-listing-card', 'sales-channels', listQuery.page, listQuery.limit],
		queryFn: () => client['sales-channels'].get({ query: listQuery }),
		enabled: lookupsEnabled
	}));
const defaultSalesChannelQuery = createQuery(() => ({
	queryKey: ['store-listing-card', 'sales-channel', store?.default_sales_channel_id ?? null],
	queryFn: () => client['sales-channels']({ id: store!.default_sales_channel_id! }).get(),
	enabled: lookupsEnabled && !!store?.default_sales_channel_id
}));
	const stockLocationsQuery = createQuery(() => ({
		queryKey: ['store-listing-card', 'stock-locations', listQuery.page, listQuery.limit],
		queryFn: () => client['stock-locations'].get({ query: listQuery }),
		enabled: lookupsEnabled
	}));

	const currencyDisplay = $derived.by(() => {
		const code = store?.default_currency_code;
		if (!code) return null;
		const rows = currenciesQuery.data?.data?.rows ?? [];
		const row = rows.find((c) => c.code === code);
		return row ? { code: row.code, name: row.name } : { code, name: null };
	});

	const regionDisplay = $derived.by(() => {
		const id = store?.default_region_id;
		if (!id) return null;
		const rows = regionsQuery.data?.data?.rows ?? [];
		const fromList = rows.find((r) => r.id === id)?.name ?? null;
		if (fromList) return fromList;
		return defaultRegionQuery.data?.data?.name ?? null;
	});

	const salesChannelDisplay = $derived.by(() => {
		const id = store?.default_sales_channel_id;
		if (!id) return null;
		const rows = salesChannelsQuery.data?.data?.rows ?? [];
	const fromList = rows.find((r) => r.id === id)?.name ?? null;
	if (fromList) return fromList;
	return defaultSalesChannelQuery.data?.data?.name ?? null;
	});

	const locationDisplay = $derived.by(() => {
		const id = store?.default_location_id;
		if (!id) return null;
		const rows = stockLocationsQuery.data?.data?.rows ?? [];
		return rows.find((r) => r.id === id)?.name ?? null;
	});

	const lookupsPending = $derived(
		lookupsEnabled &&
			(currenciesQuery.isPending ||
				regionsQuery.isPending ||
				defaultRegionQuery.isPending ||
				salesChannelsQuery.isPending ||
				defaultSalesChannelQuery.isPending ||
				stockLocationsQuery.isPending)
	);
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="border-b px-4 py-4">
		<div class="flex items-start justify-between gap-4">
			<div class="min-w-0 space-y-1">
				<h2 class="text-lg font-semibold tracking-tight">Store</h2>
				<p class="text-sm text-muted-foreground">Manage your store's details.</p>
			</div>
			{#if !loading && !errorMessage}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
						aria-label="Store actions"
					>
						<MoreHorizontal class="size-4" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content
							class="z-50 min-w-32 rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
							sideOffset={4}
						>
							<DropdownMenu.Item
								textValue="Edit"
								class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
								onSelect={() => (editStoreOpen = true)}
							>
								<Pencil class="size-4" />
								Edit
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			{/if}
		</div>
	</div>

	<div class="px-4 pb-4">
		{#if loading}
			<div class="flex min-h-[160px] items-center justify-center pt-2">
				<Loader class="size-6 animate-spin text-muted-foreground" />
			</div>
		{:else if errorMessage}
			<div
				class="mt-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
			>
				{errorMessage}
			</div>
		{:else if store}
			<div class="overflow-x-auto pt-2">
				{#if lookupsPending}
					<div class="flex min-h-[120px] items-center justify-center">
						<Loader class="size-5 animate-spin text-muted-foreground" />
					</div>
				{:else}
					<table class="w-full border-collapse text-sm">
						<tbody>
							<tr class="border-b border-border">
								<td
									class="w-[38%] max-w-[12rem] py-3 pr-4 align-middle text-muted-foreground sm:w-1/3"
									>Name</td
								>
								<td class="py-3 align-middle font-medium text-foreground">{store.name}</td>
							</tr>
							<tr class="border-b border-border">
								<td class="py-3 pr-4 align-middle text-muted-foreground">Default currency</td>
								<td class="py-3 align-middle">
									{#if currencyDisplay}
										<span class="inline-flex flex-wrap items-center gap-2">
											<span
												class="inline-flex rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground tabular-nums"
												>{currencyDisplay.code}</span
											>
											{#if currencyDisplay.name}
												<span class="font-medium text-foreground">{currencyDisplay.name}</span>
											{/if}
										</span>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</td>
							</tr>
							<tr class="border-b border-border">
								<td class="py-3 pr-4 align-middle text-muted-foreground">Default region</td>
								<td class="py-3 align-middle font-medium text-foreground">
									{#if regionDisplay}
										{regionDisplay}
									{:else if store.default_region_id}
										<span
											class="inline-flex rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs text-foreground"
											>{store.default_region_id}</span
										>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</td>
							</tr>
							<tr class="border-b border-border">
								<td class="py-3 pr-4 align-middle text-muted-foreground">Default sales channel</td>
								<td class="py-3 align-middle">
									{#if salesChannelDisplay}
										<span
											class="inline-flex rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground"
											>{salesChannelDisplay}</span
										>
									{:else if store.default_sales_channel_id}
										<span
											class="inline-flex rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs text-foreground"
											>{store.default_sales_channel_id}</span
										>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</td>
							</tr>
							<tr class="border-b border-border last:border-0">
								<td class="py-3 pr-4 align-middle text-muted-foreground">Default location</td>
								<td class="py-3 align-middle">
									{#if locationDisplay}
										<span
											class="inline-flex rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground"
											>{locationDisplay}</span
										>
									{:else if store.default_location_id}
										<span
											class="inline-flex rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs text-foreground"
											>{store.default_location_id}</span
										>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</td>
							</tr>
						</tbody>
					</table>
				{/if}
			</div>
		{:else}
			<div
				class="mt-2 flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-muted/30 px-4 py-10 text-center"
			>
				<div class="space-y-1">
					<p class="text-sm font-medium">No store yet</p>
					<p class="max-w-sm text-sm text-muted-foreground">
						Create your store to set defaults for currency, region, and locations.
					</p>
				</div>
				<Button size="sm" onclick={() => (editStoreOpen = true)}>Set up store</Button>
			</div>
		{/if}
	</div>
</div>

<EditStore
	bind:open={editStoreOpen}
	{storeUpdateForm}
	store={store ?? undefined}
	onSuccess={() => storesQuery.refetch()}
/>
