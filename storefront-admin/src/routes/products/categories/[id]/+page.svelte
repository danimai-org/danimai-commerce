<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		CategoryHeroCard,
		CategoryStatusCard,
		ProductListingCard
	} from '$lib/components/organs/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import { resolve } from '$app/paths';
	import { setDetailContext, useDetailQuery } from '$lib/hooks';

	const categoryId = $derived(page.params?.id ?? '');

	const detailQuery = useDetailQuery(async () => {
		const res = await client['product-categories']({ id: categoryId }).get();
		return res.data;
	}, ['category-detail', categoryId]);

	setDetailContext(detailQuery);

	const category = $derived(detailQuery?.data ?? null);
	const error = $derived(detailQuery?.error);
	const isPending = $derived(detailQuery?.isPending);

	let selectedIds = $state<Set<string>>(new Set());
	const productListingFilter = $derived({ category_ids: [categoryId] });
</script>

<svelte:head>
	<title>{category?.value ?? categoryId ?? 'Category'} | Categories | Danimai Store</title>
	<meta name="description" content="Manage product categories." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto(resolve('/products/categories', {}), { replaceState: true })}
			>
				<FolderTree class="size-4 shrink-0" />
				<span>Categories</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{category?.value ?? categoryId ?? '…'}</span>
		</nav>
	</div>

	{#if isPending}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !category}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Category not found'}</p>
			<Button
				variant="outline"
				onclick={() => goto(resolve('/products/categories', {}), { replaceState: true })}
				>Back to Categories</Button
			>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-3 p-6 lg:min-h-0 lg:flex-row lg:items-stretch">
				<CategoryHeroCard />
				<CategoryStatusCard
					{category}
					onUpdated={() => {
						detailQuery?.refetch();
					}}
				/>
			</div>

			<div class="flex flex-col gap-8 p-6 pt-0">
				<ProductListingCard
					title="Category Products"
					filter={productListingFilter}
					pickerFilter={{}}
					bind:selectedIds
					onAddProducts={async (ids) => {
						for (const productId of ids) {
							const res = await client.products({ id: productId }).put({
								category_id: categoryId
							});
							if (res.error) {
								const err = res.error as { value?: { message?: string } };
								throw new Error(err?.value?.message ?? String(res.error));
							}
						}
					}}
					onRemoveProducts={async (ids) => {
						for (const productId of ids) {
							const res = await client.products({ id: productId }).put({
								category_id: ''
							});
							if (res.error) {
								const err = res.error as { value?: { message?: string } };
								throw new Error(err?.value?.message ?? String(res.error));
							}
						}
					}}
				/>

				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={category?.id ?? ''}
						metadataEntity="product-category"
						metadata={category.metadata as Record<string, unknown> | null}
						onSaved={() => {
							detailQuery?.refetch();
						}}
					/>
					<JSONComponent product={category} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>
