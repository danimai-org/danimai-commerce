<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FileText from '@lucide/svelte/icons/file-text';
	import { Button } from '$lib/components/ui/button/index.js';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import {
		CollectionHeroCard,
		CollectionProductsCard,
		ProductListingCard
	} from '$lib/components/organs/index.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';

	let selectedIds = $state<Set<string>>(new Set());
	const collectionId = $derived($page.params.id);

	let collection = $state<any | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const paginationQuery = $derived.by(() => createPaginationQuery($page.url.searchParams));

	const productsQuery = createQuery(() => ({
		queryKey: ['collection-products', collectionId, paginationQuery],
		queryFn: async () => {
			const query = {
				...paginationQuery,
				collection_id: collectionId
			} as Record<string, string | number | undefined>;
			const res = await client.products.get({ query });
			return res.data as { data?: { rows: any[]; pagination: PaginationMeta } };
		},
		enabled: !!collectionId,
		refetchOnWindowFocus: false
	}));

	const productsData = $derived(
		productsQuery.data as { data?: { rows: any[]; pagination: PaginationMeta } } | null
	);

	const pagination = $derived(productsData?.data?.pagination ?? null);
	const count = $derived(pagination?.total ?? 0);

	async function loadCollection() {
		if (!collectionId) return;
		loading = true;
		error = null;
		try {
			const res = await client['collections']({ id: collectionId }).get();
			if (res.error) {
				const err = res.error as { status?: number; value?: { message?: string } };
				if (err?.status === 404) {
					error = 'Collection not found';
					return;
				}
				error = err?.value?.message ?? String(res.error);
				collection = null;
				return;
			}
			collection = (res.data ?? null) as any | null;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			collection = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		collectionId;
		loadCollection();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${$page.url.pathname}?${params.toString()}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>{collection ? collection.title : 'Collection'} | Collections | Danimai Store</title>
	<meta name="description" content="Manage product collections." />
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Breadcrumb + actions -->
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/collections')}
			>
				<FileText class="size-4 shrink-0" />
				<span>Collections</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{collection?.title ?? collectionId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !collection}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Collection not found'}</p>
			<Button variant="outline" onclick={() => goto('/products/collections')}>
				Back to Collections
			</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<div class="flex gap-6">
					<CollectionHeroCard {collection} onUpdated={loadCollection} />
				</div>

				<ProductListingCard
					title="Collection Products"
					filter={{ collection_id: collectionId }}
					bind:selectedIds
				/>

				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={collection?.id ?? null}
						metadata={collection?.metadata as Record<string, unknown> | null}
						onSaved={loadCollection}
					/>
					<JSONComponent product={collection} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>
