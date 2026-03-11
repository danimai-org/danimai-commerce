<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import { client } from '$lib/client.js';
	import { createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import type { ProductCategory } from '$lib/product-categories/types.js';
	import type { Product } from '$lib/products/types.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
import {
		CategoryHeroCard,
		CategoryStatusCard,
		CategoryProductsCard
	} from '$lib/components/organs/category/detail/index.js';
import JSONComponent from '$lib/components/organs/JSONComponent.svelte';
import MetadataComponent from '$lib/components/organs/MetadataComponent.svelte';

	const categoryId = $derived($page.params.id);

	let category = $state<ProductCategory | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const paginationQuery = $derived.by(() =>
		createPaginationQuery($page.url.searchParams)
	);

	const productsQuery = createQuery(() => ({
		queryKey: ['category-products', categoryId, paginationQuery],
		queryFn: async () => {
			const query = { ...paginationQuery, category_id: categoryId } as Record<string, string | number | undefined>;
			const res = await client.products.get({ query });
			return res.data;
		},
		enabled: !!categoryId,
		refetchOnWindowFocus: false
	}));

	const productsData = $derived(productsQuery.data as { data?: { rows: Product[]; pagination: PaginationMeta }; pagination?: PaginationMeta } | undefined);
	const products = $derived(productsData?.data?.rows ?? ([] as Product[]));
	const pagination = $derived(productsData?.data?.pagination ?? productsData?.pagination ?? null);
	const count = $derived(pagination?.total ?? 0);
	const start = $derived(
		pagination ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, count) : 0
	);
	const totalPages = $derived(pagination?.total_pages ?? 1);
	const currentPage = $derived(pagination?.page ?? 1);
	const productsLoading = $derived(productsQuery.isPending);

	async function loadCategory() {
		if (!categoryId) return;
		loading = true;
		error = null;
		try {
			const res = await client['product-categories']({ id: categoryId }).get();
			if (res.error) {
				const err = res.error as { status?: number; value?: { message?: string } };
				if (err?.status === 404) {
					error = 'Category not found';
					return;
				}
				error = err?.value?.message ?? String(res.error);
				category = null;
				return;
			}
			category = (res.data ?? null) as ProductCategory | null;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			category = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		categoryId;
		loadCategory();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${$page.url.pathname}?${params.toString()}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>{category ? category.value : 'Category'} | Categories | Danimai Store</title>
	<meta name="description" content="Manage product categories." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] text-sm pl-[10px]">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products/categories')}
			>
				<FolderTree class="size-4 shrink-0" />
				<span>Categories</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{category?.value ?? categoryId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !category}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Category not found'}</p>
			<Button variant="outline" onclick={() => goto('/products/categories')}>
				Back to Categories
			</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="flex flex-col gap-8 p-6">
				<div class="flex gap-6">
					<CategoryHeroCard categoryId={categoryId ?? null} onUpdated={loadCategory} />
					<CategoryStatusCard category={category as ProductCategory | null} onUpdated={loadCategory} />
				</div>

				<CategoryProductsCard
					categoryId={categoryId ?? null}
					category={category}
					products={products}
					count={count}
					start={start}
					end={end}
					totalPages={totalPages}
					currentPage={currentPage}
					loading={productsLoading}
					paginationQuery={paginationQuery ?? {}}
					onProductsUpdated={async () => {
						await productsQuery.refetch();
					}}
					goToPage={goToPage}
				/>

				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={category?.id ?? null}
						metadata={category?.metadata as Record<string, unknown> | null}
						onSaved={loadCategory}
					/>
					<JSONComponent
						product={category}
						options={[]}
						variants={[]}
						category={null}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>
