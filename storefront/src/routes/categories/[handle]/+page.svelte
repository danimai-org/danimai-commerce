<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { ProductGridSection } from '$lib/components/sections';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		createPagination,
		createPaginationQuery,
		type PaginationMeta
	} from '$lib/api/pagination.svelte';
	import { client } from '$lib/api/client.js';
	

	type ProductRow = { id: string; title: string; handle: string };

	type GridProduct = {
		name: string;
		price: string;
		href: string;
		bg: string;
		image?: string | null;
	};

	type CategoryPageData = {
		rows: GridProduct[];
		pagination: PaginationMeta;
		categoryTitle: string;
		categoryNotFound: boolean;
	};

	const sortOptions = [
		{ value: 'best-selling', label: 'Best selling' },
		{ value: 'newest', label: 'Newest' },
		{ value: 'title-asc', label: 'Title A–Z' },
		{ value: 'title-desc', label: 'Title Z–A' }
	];

	

	const FALLBACK_BGS = ['#e8e0d5', '#4a4a4a', '#f5f0eb', '#6b7c5c'];
	function pickBg(i: number) {
		return FALLBACK_BGS[i % FALLBACK_BGS.length];
	}

	function emptyPagination(): PaginationMeta {
		return {
			total: 0,
			page: 1,
			limit: 24,
			total_pages: 0,
			has_next_page: false,
			has_previous_page: false
		};
	}

	function productsListQuery(url: URL) {
		const p = new URLSearchParams();
		const pg = url.searchParams.get('page');
		const limit = url.searchParams.get('limit') ?? '24';
		if (pg) p.set('page', pg);
		p.set('limit', limit);
		return createPaginationQuery(p);
	}

	function gotoWithParams(updates: Record<string, string>) {
		const u = new URL(page.url);
		for (const [k, v] of Object.entries(updates)) {
			if (v === 'all' || !v) u.searchParams.delete(k);
			else u.searchParams.set(k, v);
		}
		goto(u.pathname + u.search, { replaceState: true });
	}

	function applySort(e: Event) {
		gotoWithParams({ sort: (e.currentTarget as HTMLSelectElement).value });
	}
	function applyAvailability(e: Event) {
		gotoWithParams({ availability: (e.currentTarget as HTMLSelectElement).value });
	}
	function applyPrice(e: Event) {
		gotoWithParams({ price: (e.currentTarget as HTMLSelectElement).value });
	}
	function applyColor(e: Event) {
		gotoWithParams({ color: (e.currentTarget as HTMLSelectElement).value });
	}

	function goToPage(nextPage: number) {
		const u = new URL(page.url);
		u.searchParams.set('page', String(nextPage));
		goto(u.toString());
	}

	const paginateState = createPagination(
		async (): Promise<CategoryPageData> => {
			const handle = page.params.handle ? decodeURIComponent(String(page.params.handle)).trim() : '';
			if (!handle) {
				return {
					rows: [],
					pagination: emptyPagination(),
					categoryTitle: '',
					categoryNotFound: true
				};
			}

			const catRes = await client['product-categories'].get({
				query: createPaginationQuery(new URLSearchParams({ page: '1', limit: '200' }))
			});
			if (catRes.error) {
				const err = catRes.error as { value?: { message?: string } };
				throw new Error(err?.value?.message ?? String(catRes.error));
			}
			const catPayload = catRes.data as
				| { rows?: Array<{ id: string; handle: string; value: string }> }
				| undefined;
			const categories = catPayload?.rows ?? [];
			const category = categories.find((c) => c.handle === handle);
			if (!category) {
				return {
					rows: [],
					pagination: emptyPagination(),
					categoryTitle: handle,
					categoryNotFound: true
				};
			}

			const sortParam = page.url.searchParams.get('sort') ?? 'best-selling';
			const sort = { sorting_field: 'products.title', sorting_direction: 'desc' };

			const pq = productsListQuery(page.url);
			const pres = await client.products.get({
				query: {
					...pq,
					sorting_field: sort.sorting_field,
					sorting_direction: sort.sorting_direction,
					filters: { category_ids: [category.id] }
				}
			});
			if (pres.error) {
				const err = pres.error as { value?: { message?: string } };
				throw new Error(err?.value?.message ?? String(pres.error));
			}
			const pdata = pres.data as { rows?: ProductRow[]; pagination?: PaginationMeta } | undefined;
			const productRows = pdata?.rows ?? [];
			const grid: GridProduct[] = productRows.map((p, i) => ({
				name: p.title,
				price: '—',
				href: `/products/${p.handle}`,
				bg: pickBg(i),
				image: null
			}));
			return {
				rows: grid,
				pagination: pdata?.pagination ?? emptyPagination(),
				categoryTitle: category.value,
				categoryNotFound: false
			};
		},
		['category-products'],
		createPaginationQuery(productsListQuery(page.url)),
		{ keySuffix: () => [page.params.handle ?? '', page.url.search] }
	);

	const { query } = paginateState;
	const loading = $derived(paginateState.loading);
	const fetchError = $derived(paginateState.error);
	const pagination = $derived(paginateState.pagination);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);

	const products = $derived((query.data?.rows ?? []) as GridProduct[]);
	const productCount = $derived(pagination?.total ?? 0);
	const categoryNotFound = $derived(query.data?.categoryNotFound === true);
	const categoryTitle = $derived(
		query.data?.categoryTitle ?? page.params.handle ?? 'Category'
	);

	const currentSort = $derived(page.url.searchParams.get('sort') ?? 'best-selling');
	const currentAvailability = $derived(page.url.searchParams.get('availability') ?? 'all');
	const currentPrice = $derived(page.url.searchParams.get('price') ?? 'all');
	const currentColor = $derived(page.url.searchParams.get('color') ?? 'all');
</script>

<svelte:head>
	<title>{categoryTitle} – ESSENTIALS</title>
</svelte:head>

<SiteHeader />

{#if fetchError}
	<main class="category-main">
		<p class="category-error">{fetchError}</p>
	</main>
{:else if categoryNotFound}
	<main class="category-main">
		<p class="category-error">Category not found</p>
	</main>
{:else}
	<main class="category-main">
		<section class="category-hero" aria-label={categoryTitle}>
			<h1 class="category-hero-title">{categoryTitle}</h1>
		</section>
		<div class="category-toolbar">
			<div class="toolbar-filters">
				<span class="toolbar-label">Filter:</span>
				<select class="toolbar-select" onchange={applyAvailability} value={currentAvailability} aria-label="Availability">
					<option value="all">Availability</option>
					<option value="in-stock">In stock</option>
					<option value="out-of-stock">Out of stock</option>
				</select>
				<select class="toolbar-select" onchange={applyPrice} value={currentPrice} aria-label="Price">
					<option value="all">Price</option>
					<option value="0-50">Under $50</option>
					<option value="50-100">$50 – $100</option>
					<option value="100-200">$100 – $200</option>
					<option value="200-plus">$200+</option>
				</select>
				<select class="toolbar-select" onchange={applyColor} value={currentColor} aria-label="Color">
					<option value="all">Color</option>
					<option value="black">Black</option>
					<option value="white">White</option>
					<option value="gray">Gray</option>
					<option value="navy">Navy</option>
					<option value="green">Green</option>
					<option value="beige">Beige</option>
					<option value="brown">Brown</option>
				</select>
			</div>
			<div class="toolbar-group">
				<label for="sort-by" class="toolbar-label">Sort by:</label>
				<select id="sort-by" class="toolbar-select" onchange={applySort} value={currentSort} aria-label="Sort products">
					{#each sortOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
			<span class="product-count">{productCount} {productCount === 1 ? 'product' : 'products'}</span>
		</div>
		<div class="category-toolbar-meta" aria-live="polite">
			{#if loading}
				<span class="category-loading">Loading…</span>
			{/if}
			{#if pagination && pagination.total > 0}
				<span class="category-range">{start}–{end} of {pagination.total}</span>
			{/if}
			{#if pagination && pagination.total_pages > 1}
				<div class="category-pagination">
					<button
						type="button"
						class="category-page-btn"
						disabled={loading || !pagination.has_previous_page}
						onclick={() => goToPage(pagination.page - 1)}
					>
						Previous
					</button>
					<span class="category-page-num">Page {pagination.page} of {pagination.total_pages}</span>
					<button
						type="button"
						class="category-page-btn"
						disabled={loading || !pagination.has_next_page}
						onclick={() => goToPage(pagination.page + 1)}
					>
						Next
					</button>
				</div>
			{/if}
		</div>
		<ProductGridSection products={products} title="" subtitle="" />
	</main>
{/if}

<SiteFooter />

<style>
	.category-main {
		min-height: 40vh;
	}
	.category-hero {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		max-width: 1200px;
		margin: 0 auto;
		background: linear-gradient(180deg, #e8e0d5 0%, #d4c8bc 100%);
		padding: 3rem 1.5rem;
		box-sizing: border-box;
	}
	.category-hero-title {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		color: #fff;
		text-align: center;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		letter-spacing: -0.02em;
		line-height: 1.2;
	}
	.category-toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 1.5rem 2rem;
		border-bottom: 1px solid #eee;
	}
	.category-toolbar-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 1rem 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem 1rem;
		font-size: 0.875rem;
		color: #555;
	}
	.category-loading {
		color: #666;
	}
	.category-range {
		margin: 0 auto;
	}
	.category-pagination {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.category-page-btn {
		padding: 0.35rem 0.75rem;
		font-size: 0.875rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: #fff;
		cursor: pointer;
	}
	.category-page-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.category-page-num {
		color: #666;
	}
	.toolbar-filters {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
	}
	.toolbar-filters .toolbar-select {
		min-width: 7rem;
	}
	.toolbar-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.toolbar-label {
		font-size: 0.875rem;
		color: #555;
	}
	.toolbar-select {
		font-size: 0.875rem;
		padding: 0.35rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: #fff;
		color: #1a1a1a;
		cursor: pointer;
	}
	.product-count {
		margin-left: auto;
		font-size: 0.875rem;
		color: #666;
	}
	.category-error {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1.5rem;
		color: #c00;
		text-align: center;
	}
</style>
