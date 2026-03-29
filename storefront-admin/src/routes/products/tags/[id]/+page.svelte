<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Tag from '@lucide/svelte/icons/tag';
	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ProductListingCard, TagHeroCard } from '$lib/components/organs/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';
	import EditTag from '$lib/components/organs/tag/update/EditTag.svelte';
	import { resolve } from '$app/paths';
	import { createQuery } from '@tanstack/svelte-query';
	import { setDetailContext } from '$lib/hooks';

	const tagId = $derived(page.params?.id ?? '');
	let formSheetOpen = $state(false);

	const detailQuery = createQuery(() => ({
		queryKey: ['tag-detail', page.params?.id ?? ''],
		queryFn: async () => {
			const id = page.params?.id ?? '';
			const res = await client['product-tags']({ id }).get();
			return res.data;
		},
		refetchOnWindowFocus: false
	}));

	setDetailContext(detailQuery);

	const tag = $derived(detailQuery?.data ?? null);
	const error = $derived(detailQuery?.error);
	const isPending = $derived(detailQuery?.isPending);

	let selectedIds = $state<Set<string>>(new Set());
</script>

<svelte:head>
	<title>{tag?.value ?? tagId ?? 'Tag'} | Tags | Danimai Store</title>
	<meta name="description" content="Manage product tags." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto(resolve('/products/tags', {}), { replaceState: true })}
			>
				<Tag class="size-4 shrink-0" />
				<span>Tags</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{tag?.value ?? tagId ?? '…'}</span>
		</nav>
	</div>

	{#if isPending}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !tag}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Tag not found'}</p>
			<Button
				variant="outline"
				onclick={() => goto(resolve('/products/tags', {}), { replaceState: true })}
				>Back to Tags</Button
			>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-4 p-6">
				<TagHeroCard {tag} />
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
						metadataEntity="product-tag"
						metadata={tag.metadata as Record<string, unknown> | null}
						onSaved={() => {
							void detailQuery?.refetch();
						}}
					/>
					<JSONComponent product={tag} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>

<EditTag bind:open={formSheetOpen} onClosed={() => (formSheetOpen = false)} />
