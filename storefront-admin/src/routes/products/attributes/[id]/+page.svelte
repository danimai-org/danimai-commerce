<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { Button } from '$lib/components/ui/button/index.js';
	import { createPaginationQuery } from '$lib/api/pagination.svelte';
	import { client } from '$lib/client';
	import {
		AttributeHeroCard,
		AttributeProductsCard,
	} from '$lib/components/organs/attribute/detail/index.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
	import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';

	type AttributeProduct = {
		id: string;
		title: string;
		handle: string;
		status: string;
		thumbnail: string | null;
		category_id: string | null;
		created_at: string;
		updated_at: string;
		collection: { id: string; title: string; handle: string } | null;
		variants: Array<{ id: string }>;
	};

	
	const attributeId = $derived(page.params.id);
	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));
	const productLimit = $derived.by(() => {
		const value = Number(paginationQuery.limit ?? 10);
		return Number.isFinite(value) && value > 0 ? value : 10;
	});

	async function fetchAttributeProducts(
		id: string
	): Promise<{ data: AttributeProduct[]; pagination: PaginationMeta | null }> {
		const res = await (client as any)['product-attributes']({ id })['products'].get({
			query: {
				...paginationQuery,
				limit: String(productLimit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			}
		});
		const typedRes = res as { data: AttributeProduct[] | null; pagination: PaginationMeta | null } | undefined;
		return {
			data: typedRes?.data ?? [],
			pagination: typedRes?.pagination ?? null
		};
	}

	const attributeQuery = $derived(
		createQuery(() => ({
			queryKey: ['product-attributes', attributeId],
			queryFn: async () => {
				return client['product-attributes']({ id: attributeId }).get();
			}
		}))
	);

	const productsQuery = $derived(
		createQuery(() => ({
			queryKey: ['product-attribute-products', attributeId, paginationQuery],
			queryFn: async () => fetchAttributeProducts(attributeId)
		}))
	);

	const attribute = $derived((attributeQuery.data?.data ?? null) as any | null);
	const productsData = $derived(productsQuery.data ?? null);
	const loading = $derived(attributeQuery.isPending);
	const error = $derived(
		attributeQuery.error != null
			? attributeQuery.error instanceof Error
				? attributeQuery.error.message
				: String(attributeQuery.error)
			: null
	);
	const products = $derived((productsData?.data ?? []) as AttributeProduct[]);
	const pagination = $derived((productsData?.pagination ?? null) as PaginationMeta | null);
	const count = $derived(pagination?.total ?? 0);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(pagination ? Math.min(pagination.page * pagination.limit, count) : 0);

	function goToProductPage(pageNumber: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNumber)));
		if (!params.get('limit')) {
			params.set('limit', String(productLimit));
		}
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	async function refetchAttributeData() {
		await Promise.all([attributeQuery.refetch(), productsQuery.refetch()]);
	}
</script>

<svelte:head>
	<title>{attribute ? attribute.title : 'Attribute'} | Attributes | Danimai Store</title>
	<meta name="description" content="Manage product attributes." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] text-sm pl-[10px]">
			<button
				type="button"
				class="flex items-center gap-1 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products')}
			>
				<ChevronLeft class="size-4" />
				Products
			</button>
			<span class="text-muted-foreground">/</span>
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/attributes')}
			>
				Attributes
			</button>
			<span class="text-muted-foreground">/</span>
			<span class="font-medium">{attribute?.title ?? attributeId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !attribute}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Attribute not found'}</p>
			<Button variant="outline" onclick={() => goto('/products/attributes')}
				>Back to Attributes</Button
			>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<div class="flex gap-6">
					<AttributeHeroCard {attribute} onUpdated={refetchAttributeData} />
				</div>

				
				<AttributeProductsCard
					attributeId={attributeId ?? null}
					{products}
					pagination={pagination}
					loading={productsQuery.isPending}
					{start}
					{end}
					onPageChange={goToProductPage}
					paginationQuery={paginationQuery ?? {}}
					onProductsUpdated={async () => {
						await productsQuery.refetch();
					}}
				/>

				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent productId={attribute?.id ?? null} metadata={attribute?.metadata ?? {}} onSaved={refetchAttributeData} />
					<JSONComponent product={attribute} options={[]} variants={[]} category={null} />

				</div>
			</div>
		</div>
	{/if}
</div>
