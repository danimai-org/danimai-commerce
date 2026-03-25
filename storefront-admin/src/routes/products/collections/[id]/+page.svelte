<script lang="ts">
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { client } from '$lib/client.js';
	import { resolve } from '$app/paths';
	import { CollectionHeroCard, ProductListingCard } from '$lib/components/organs/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';

	const collectionId = $derived(page.params?.id ?? '');

	type CollectionDetail = {
		id: string;
		title: string;
		handle: string;
		metadata?: unknown | null;
	};

	const collectionDetailQuery = createQuery(() => ({
		queryKey: ['collection-detail', collectionId],
		queryFn: async (): Promise<CollectionDetail | null> => {
			if (!collectionId) return null;
			const res = await client['collections']({ id: collectionId }).get();
			if (res?.error) {
				const err = res.error as { status?: number; value?: { message?: string } };
				if (err?.status === 404) {
					throw new Error('Collection not found');
				}
				throw new Error(String(err?.value?.message ?? res.error));
			}
			return (res?.data ?? null) as CollectionDetail | null;
		},
		enabled: !!collectionId,
		refetchOnWindowFocus: false
	}));

	const collection = $derived(collectionDetailQuery.data ?? null);
	const loading = $derived(collectionDetailQuery.isPending && collectionDetailQuery.isFetching);
	const error = $derived(
		collectionDetailQuery.error != null
			? collectionDetailQuery.error instanceof Error
				? collectionDetailQuery.error.message
				: String(collectionDetailQuery.error)
			: collection === null && collectionDetailQuery.isSuccess && collectionId
				? 'Collection not found'
				: null
	);

	const displayName = $derived(collection?.title ?? collectionId ?? 'Collection');

	let selectedIds = $state<Set<string>>(new Set());

	async function refetchCollection() {
		await collectionDetailQuery.refetch();
	}
</script>

<svelte:head>
	<title>{displayName} | Collections | Danimai Store</title>
	<meta name="description" content="Manage product collections." />
</svelte:head>
<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div
			class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-b pb-4 text-sm text-muted-foreground"
		>
			<a href={resolve('/products/collections', {})} class="hover:text-foreground">Collections</a>
			<span>/</span>
			<span class="text-foreground">{displayName}</span>
		</div>

		{#if error}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{error}
			</div>
		{:else if loading}
			<div class="flex min-h-0 flex-1 items-center justify-center">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else if collection}
			<div class="flex flex-col gap-6">
				<div class="flex gap-6">
					<CollectionHeroCard {collection} onUpdated={refetchCollection} />
				</div>
				<ProductListingCard
					title="Collection Products"
					filter={{ collection_ids: [collectionId] }}
					pickerFilter={{}}
					bind:selectedIds
					onAddProducts={async (ids) => {
						const res = await client['collections']({ id: collectionId }).products.put({
							products: { add: ids, remove: [] }
						});
						if (res.error) {
							const err = res.error as { value?: { message?: string } };
							throw new Error(err?.value?.message ?? String(res.error));
						}
					}}
					onRemoveProducts={async (ids) => {
						const res = await client['collections']({ id: collectionId }).products.put({
							products: { add: [], remove: ids }
						});
						if (res.error) {
							const err = res.error as { value?: { message?: string } };
							throw new Error(err?.value?.message ?? String(res.error));
						}
					}}
				/>

				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={collection.id}
						metadataEntity="collection"
						metadata={collection.metadata as Record<string, unknown> | null}
						onSaved={refetchCollection}
					/>
					<JSONComponent product={collection} options={[]} variants={[]} category={null} />
				</div>
			</div>
		{/if}
	</div>
</div>
