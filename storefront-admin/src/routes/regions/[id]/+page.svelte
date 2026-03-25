<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Globe from '@lucide/svelte/icons/globe';

	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/index.js';
	import EditRegion from '$lib/components/organs/region/update/edit-region.svelte';
	import RegionHeroCard from '$lib/components/organs/region/detail/RegionHeroCard.svelte';
	import RegionCountriesCard from '$lib/components/organs/region/detail/RegionCountriesCard.svelte';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import { createPagination, createPaginationQuery } from '$lib/api';
	import { resolve } from '$app/paths';

	// 1. Get ID from params (Reactive)
	const regionId = $derived(page.params.id);

	// 2. Initialize Pagination State
	// Passing regionId inside the arrow function ensures it refetches when the ID changes
	const paginateState = createPagination(
		async () => {
			if (!regionId) throw new Error('Missing Region ID');
			return client.regions({ id: regionId }).get();
		},
		['regions', regionId], // Added regionId to keys to force refresh on route change
		createPaginationQuery(page.url.searchParams)
	);

	const { query } = paginateState;
	const region = $derived(query.data?.data ?? null);
	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);

	// UI States
	let editOpen = $state(false);
	let deleteConfirmOpen = $state(false);
	let deleteSubmitting = $state(false);
	let deleteError = $state<string | null>(null);

	// Manual Refresh Helper
	async function refreshData() {
		await paginateState.refetch();
	}

	function openEdit() {
		editOpen = true;
	}

	function openDelete() {
		deleteError = null;
		deleteConfirmOpen = true;
	}

	async function confirmDelete() {
		if (!region?.id) return;

		deleteSubmitting = true;
		deleteError = null;

		try {
			const { error: apiError } = await client.regions.delete({ ids: [region.id] });
			if (apiError) throw new Error(apiError.value?.message || 'Failed to delete');

			deleteConfirmOpen = false;
			// Use path helper to go back
			goto(resolve('/regions', {}), { replaceState: true });
		} catch (e) {
			deleteError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	function handleEditSuccess() {
		editOpen = false;
		refreshData();
	}
</script>

<svelte:head>
	<title>{region?.name ?? 'Loading...'} | Regions</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<a
				href={resolve('/regions', {})}
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
			>
				<Globe class="size-4 shrink-0" />
				<span>Regions</span>
			</a>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
			<span class="font-medium text-foreground">{region?.name ?? '...'}</span>
		</nav>
	</div>

	{#if loading && !region}
		<div class="flex flex-1 items-center justify-center p-6">
			<span class="animate-pulse text-muted-foreground">Loading Region Details...</span>
		</div>
	{:else if error}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">Error: {error}</p>
			<Button
				variant="outline"
				onclick={() => goto(resolve('/regions', {}), { replaceState: true })}
				>Back to Regions</Button
			>
		</div>
	{:else if region}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-6 p-6">
				<RegionHeroCard {region} onEdit={openEdit} onDelete={openDelete} />

				<RegionCountriesCard regionId={region.id} />

				<div class="grid gap-4 sm:grid-cols-2">
					<JSONComponent product={region} options={[]} variants={[]} category={null} />

					<MetadataComponent
						productId={region.id}
						metadata={region.metadata as Record<string, unknown> | null}
						metadataEntity="region"
						onSaved={refreshData}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>

<EditRegion bind:open={editOpen} {region} onSuccess={handleEditSuccess} />

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="region"
	entityTitle={region?.name ?? ''}
	onConfirm={confirmDelete}
	onCancel={() => (deleteConfirmOpen = false)}
	submitting={deleteSubmitting}
	error={deleteError}
/>
