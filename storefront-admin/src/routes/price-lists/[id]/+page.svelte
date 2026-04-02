<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Folder from '@lucide/svelte/icons/folder';
	import { client } from '$lib/client.js';
	import { useDetailQuery, setDetailContext } from '$lib/hooks';
	import { JSONComponent } from '$lib/components/organs/index.js';
	import ProductListingCard from '$lib/components/organs/product/detail/ProductListingCard.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import PriceListHeroCard from '$lib/components/organs/price-list/detail/PriceListHeroCard.svelte';
	import PriceListConfigurationCard from '$lib/components/organs/price-list/detail/PriceListConfigurationCard.svelte';
	import { setPriceListUpdateFormContext } from '$lib/hooks/price-list-edit-context';
	let { data }: { data: PageData } = $props();
	$effect(() => {
		setPriceListUpdateFormContext(data.priceListUpdateForm);
	});
	type PriceList = {
		id: string;
		name: string;
		description: string | null;
		type: 'sale' | 'override';
		status: 'active' | 'draft';
		starts_at: string | null;
		ends_at: string | null;
		metadata: unknown | null;
		created_at: Date;
		updated_at: Date;
		deleted_at: Date | null;
	};

	const priceListId = $derived(page.params?.id ?? '');

	const detailQuery = useDetailQuery(
		async () => {
			if (!priceListId) throw new Error('Missing price list ID');
			const res = await client['price-lists']({ id: priceListId }).get();
			return (res as { data?: PriceList })?.data ?? null;
		},
		() => ['price-list-detail', priceListId]
	);

	setDetailContext(detailQuery);

	const priceList = $derived(detailQuery?.data ?? null);
	const error = $derived(detailQuery?.error);
	const isPending = $derived(detailQuery?.isPending);
</script>

<svelte:head>
	<title>{priceList?.name ?? priceListId ?? 'Price List'} | Price Lists | Danimai Store</title>
	<meta name="description" content="Price list details." />
</svelte:head>

<div class="flex h-full flex-col bg-background">
	<div class="shrink-0 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto(resolve('/price-lists', {}), { replaceState: true })}
			>
				<Folder class="size-4 shrink-0" />
				<span>Price Lists</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{priceList?.name ?? priceListId ?? '…'}</span>
		</nav>
	</div>

	{#if isPending}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !priceList}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Price list not found'}</p>
			<Button
				variant="outline"
				onclick={() => goto(resolve('/price-lists', {}), { replaceState: true })}
			>
				Back to Price Lists
			</Button>
		</div>
	{:else}
		<div class="min-h-0 flex-1 overflow-auto px-6 py-6">
			<div class="mx-auto flex max-w-5xl flex-col gap-6">
				<div class="grid gap-4 sm:grid-cols-2">
					<PriceListHeroCard />
					<PriceListConfigurationCard />
				</div>

				<ProductListingCard
					title="Products"
					emptyText="No products found."
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

				<JSONComponent
					product={priceList as unknown as Record<string, unknown>}
					options={[]}
					variants={[]}
					category={null}
				/>
			</div>
		</div>
	{/if}
</div>
