<script lang="ts">
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { client } from '$lib/client.js';
	import { resolve } from '$app/paths';
	import {
		CategoryHeroCard,
		CategoryStatusCard,
		ProductListingCard
	} from '$lib/components/organs/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';

	const categoryId = $derived(page.params?.id ?? '');

	type CategoryGetResponse = Awaited<
		ReturnType<ReturnType<(typeof client)['product-categories']>['get']>
	>;
	type CategoryDetail = CategoryGetResponse extends { data: infer Data } ? Data : never;

	function metadataRecord(metadata: unknown): Record<string, unknown> | null {
		if (metadata == null) return null;
		if (typeof metadata !== 'object' || Array.isArray(metadata)) return null;
		return { ...metadata };
	}

	const categoryDetailQuery = createQuery(() => ({
		queryKey: ['category-detail', categoryId],
		queryFn: async (): Promise<CategoryDetail | null> => {
			if (!categoryId) return null;
			const res = await client['product-categories']({ id: categoryId }).get();
			if (res?.error) {
				const err = res.error as { status?: number; value?: { message?: string } };
				if (err?.status === 404) {
					throw new Error('Category not found');
				}
				throw new Error(String(err?.value?.message ?? res.error));
			}
			return (res?.data ?? null) as CategoryDetail | null;
		},
		enabled: !!categoryId,
		refetchOnWindowFocus: false
	}));

	const category = $derived(categoryDetailQuery.data ?? null);
	const loading = $derived(categoryDetailQuery.isPending && categoryDetailQuery.isFetching);
	const error = $derived(
		categoryDetailQuery.error != null
			? categoryDetailQuery.error instanceof Error
				? categoryDetailQuery.error.message
				: String(categoryDetailQuery.error)
			: category === null && categoryDetailQuery.isSuccess && categoryId
				? 'Category not found'
				: null
	);

	const displayName = $derived(category?.value ?? categoryId ?? 'Category');

	let selectedIds = $state<Set<string>>(new Set());

	async function refetchCategory() {
		await categoryDetailQuery.refetch();
	}
</script>

<svelte:head>
	<title>{displayName} | Categories | Danimai Store</title>
	<meta name="description" content="Manage product categories." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div
			class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-b pb-4 text-sm text-muted-foreground"
		>
			<a href={resolve('/products/categories', {})} class="hover:text-foreground">Categories</a>
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
		{:else if category}
			<div class="flex flex-col gap-6">
				<div class="flex gap-6">
					<CategoryHeroCard {category} onUpdated={refetchCategory} />
					<CategoryStatusCard {category} onUpdated={refetchCategory} />
				</div>
				<ProductListingCard
					title="Category Products"
					filter={{ category_ids: [categoryId] }}
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
						productId={category.id}
						metadataEntity="product-category"
						metadata={metadataRecord(category.metadata)}
						onSaved={refetchCategory}
					/>
					<JSONComponent product={{ ...category }} options={[]} variants={[]} category={null} />
				</div>
			</div>
		{/if}
	</div>
</div>
