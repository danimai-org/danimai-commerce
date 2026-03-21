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


	const regionId = $derived(page.params?.id ?? '');

	type Region = {
		id: string;
		name: string;
		currency_code: string;
		metadata?: Record<string, unknown>;
	};

	let region = $state<Region | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let editOpen = $state(false);
	let deleteConfirmOpen = $state(false);
	let deleteSubmitting = $state(false);
	let deleteError = $state<string | null>(null);

	async function loadRegion() {
		if (!regionId) return;
		loading = true;
		error = null;
		try {
			const res = await client.regions({ id: regionId }).get();
			if (res.error) {
				const err = res.error as { status?: number; value?: { message?: string } };
				if (err?.status === 404) {
					error = 'Region not found';
				} else {
					error = String(err?.value?.message ?? res.error);
				}
				region = null;
				return;
			}
			region = (res.data ?? null) as Region | null;
			if (!region) {
				error = 'Region not found';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			region = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		regionId;
		loadRegion();
	});

	function openEdit() {
		editOpen = true;
	}

	function openDelete() {
		deleteError = null;
		deleteConfirmOpen = true;
	}

	async function confirmDelete() {
		if (!region) return;
		deleteSubmitting = true;
		deleteError = null;
		try {
			await client.regions.delete({ ids: [region.id] });
			deleteConfirmOpen = false;
			goto('/regions');
		} catch (e) {
			deleteError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	function handleEditSuccess() {
		editOpen = false;
		loadRegion();
	}
</script>

<svelte:head>
	<title>{region?.name ?? regionId ?? 'Region'} | Regions | Danimai Store</title>
	<meta name="description" content="Manage region details." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/regions')}
			>
				<Globe class="size-4 shrink-0" />
				<span>Regions</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{region?.name ?? regionId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !region}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Region not found'}</p>
			<Button variant="outline" onclick={() => goto('/regions')}>Back to Regions</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-6 p-6">
				<RegionHeroCard {region} onEdit={openEdit} onDelete={openDelete} />
				<RegionCountriesCard regionId={region.id} />
				<div class="grid gap-4 sm:grid-cols-2">
					<JSONComponent product={region} options={[]} variants={[]} category={null} />
					<MetadataComponent
						productId={region?.id ?? null}
						metadata={region?.metadata as Record<string, unknown> | null}
						metadataEntity="region"
						onSaved={loadRegion}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>

<EditRegion
	bind:open={editOpen}
	region={region}
	onSuccess={handleEditSuccess}
/>

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="region"
	entityTitle={region?.name ?? region?.id ?? ''}
	onConfirm={confirmDelete}
	onCancel={() => {
		deleteConfirmOpen = false;
	}}
	submitting={deleteSubmitting}
	error={deleteError}
/>
