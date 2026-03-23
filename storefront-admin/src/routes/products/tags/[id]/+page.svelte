<script lang="ts">
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { client } from '$lib/client.js';
	import { resolve } from '$app/paths';
	import { TagHeroCard } from '$lib/components/organs/index.js';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import { ProductListingCard } from '$lib/components/organs/index.js';
	const tagId = $derived(page.params?.id ?? '');
	type TagDetail = {
		id: string;
		value: string;
		metadata?: unknown | null;
	};

	const tagDetailQuery = createQuery(() => ({
		queryKey: ['tag-detail', tagId],
		queryFn: async (): Promise<TagDetail | null> => {
			if (!tagId) return null;
			const res = await client['product-tags']({ id: tagId }).get();
			if (res?.error) {
				const err = res.error as { status?: number; value?: { message?: string } };
				if (err?.status === 404) {
					throw new Error('Tag not found');
				}
				throw new Error(String(err?.value?.message ?? res.error));
			}
			return (res?.data ?? null) as TagDetail | null;
		},
		enabled: !!tagId,
		refetchOnWindowFocus: false
	}));

	const tag = $derived(tagDetailQuery.data ?? null);
	const loading = $derived(tagDetailQuery.isPending && tagDetailQuery.isFetching);
	const error = $derived(
		tagDetailQuery.error != null
			? tagDetailQuery.error instanceof Error
				? tagDetailQuery.error.message
				: String(tagDetailQuery.error)
			: tag === null && tagDetailQuery.isSuccess && tagId
				? 'Tag not found'
				: null
	);

	const displayName = $derived(tag?.value ?? tagId ?? 'Tag');
	let selectedIds = $state<Set<string>>(new Set());
	async function refetchTag() {
		await tagDetailQuery.refetch();
	}
</script>

<svelte:head>
	<title>{displayName} | Tags | Danimai Store</title>
	<meta name="description" content="Manage product tags." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div
			class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-b pb-4 text-sm text-muted-foreground"
		>
			<a href={resolve('/products/tags', {})} class="hover:text-foreground">Tags</a>
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
		{:else if tag}
			<div class="flex flex-col gap-6">
				<div class="flex gap-6">
					<TagHeroCard {tag} onUpdated={refetchTag} />
				</div>

				<ProductListingCard
					title="Tagged products"
					filter={{ tag_ids: [tagId] }}
					pickerFilter={{}}
					bind:selectedIds
					onAddProducts={async (ids) => {
						const res = await client['product-tags']({ id: tagId }).products.post({
							product_ids: ids
						});
						if (res.error) {
							const err = res.error as { value?: { message?: string } };
							throw new Error(err?.value?.message ?? String(res.error));
						}
					}}
					onRemoveProducts={async (ids) => {
						const res = await client['product-tags']({ id: tagId }).products.delete({
							product_ids: ids
						});
						if (res.error) {
							const err = res.error as { value?: { message?: string } };
							throw new Error(err?.value?.message ?? String(res.error));
						}
					}}
				/>
				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={tag.id}
						metadata={tag.metadata as Record<string, unknown> | null}
						metadataEntity="product-tag"
						onSaved={refetchTag}
					/>
					<JSONComponent product={tag} options={[]} variants={[]} category={null} />
				</div>
			</div>
		{/if}
	</div>
</div>
