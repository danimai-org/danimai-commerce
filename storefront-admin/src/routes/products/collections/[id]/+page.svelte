<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Layers from '@lucide/svelte/icons/layers';
	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { CollectionHeroCard, ProductListingCard } from '$lib/components/organs/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';

	import { resolve } from '$app/paths';
	import { setDetailContext, useDetailQuery } from '$lib/hooks';

	const collectionId = $derived(page.params?.id ?? '');

	const detailQuery = useDetailQuery(async () => {
		const res = await client['collections']({ id: collectionId }).get();
		return res.data;
	}, ['collection-detail', collectionId]);

	setDetailContext(detailQuery);

	const collection = $derived(detailQuery?.data ?? null);
	const error = $derived(detailQuery?.error);
	const isPending = $derived(detailQuery?.isPending);
	let selectedIds = $state<Set<string>>(new Set());
	const productListingFilter = $derived({ collection_ids: [collectionId] });
</script>

<svelte:head>
	<title>{collection?.title ?? collectionId ?? 'Collection'} | Collections | Danimai Store</title>
	<meta name="description" content="Manage product collections." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto(resolve('/products/collections', {}), { replaceState: true })}
			>
				<Layers class="size-4 shrink-0" />
				<span>Collections</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{collection?.title ?? collectionId ?? '…'}</span>
		</nav>
	</div>

	{#if isPending}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !collection}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Collection not found'}</p>
			<Button
				variant="outline"
				onclick={() => goto(resolve('/products/collections', {}), { replaceState: true })}
				>Back to Collections</Button
			>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<CollectionHeroCard />

			<div class="flex flex-col gap-8 p-6">
				<ProductListingCard
					filter={productListingFilter}
					title="Collection Products"
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
						productId={collection?.id ?? ''}
						metadataEntity="collection"
						metadata={collection.metadata as Record<string, unknown> | null}
						onSaved={() => {
							detailQuery?.refetch();
						}}
					/>
					<JSONComponent product={collection} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>
