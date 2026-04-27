<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { ProductGridSection } from '$lib/components/sections';
	import CatalogToolbar from '$lib/components/sections/CatalogToolbar.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		createPagination,
		createPaginationQuery,
		type PaginationMeta
	} from '$lib/api/pagination.svelte';
	import { API_BASE, rowsFromPaginated } from '$lib/api/storefront-api';
	import { client } from '$lib/api/client.js';
	import {
		type CategoryNavRow,
		categoryParentId,
		isBottomCategory,
		isChildCategory
	} from '$lib/category-nav';

	type StorefrontProductRow = {
		title: string;
		handle: string;
		thumbnail: string | null;
		variant: {
			thumbnail: string | null;
			price: { amount: string; currency_code: string } | null;
		} | null;
	};

	type ProductGridItem = {
		name: string;
		price: { amount: number; currency_code: string };
		href: string;
		bg: string;
		image: string | null;
		variantId?: string | null;
	};

	type CategoryPageData = {
		rows: ProductGridItem[];
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

	const STOREFRONT_SORT: Record<string, { field: string; dir: 'asc' | 'desc' }> = {
		'best-selling': { field: 'products.title', dir: 'desc' },
		newest: { field: 'products.handle', dir: 'desc' },
		'title-asc': { field: 'products.title', dir: 'asc' },
		'title-desc': { field: 'products.title', dir: 'desc' }
	};

	function descendantCategoryIds(rootId: string, all: CategoryNavRow[]): string[] {
		const byParent = new Map<string, CategoryNavRow[]>();
		for (const c of all) {
			const pid = categoryParentId(c);
			if (!pid) continue;
			const list = byParent.get(pid);
			if (list) list.push(c);
			else byParent.set(pid, [c]);
		}
		const out: string[] = [];
		const stack = [rootId];
		while (stack.length) {
			const id = stack.pop()!;
			out.push(id);
			const kids = byParent.get(id);
			if (kids) for (const k of kids) stack.push(k.id);
		}
		return out;
	}

	function expandCategoryIds(ids: string[], all: CategoryNavRow[]): string[] {
		const seen = new Set<string>();
		for (const id of ids) {
			for (const x of descendantCategoryIds(id, all)) seen.add(x);
		}
		return [...seen];
	}


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

			const catRes = await client.admin['product-categories'].get({
				query: createPaginationQuery(new URLSearchParams({ page: '1', limit: '200' }))
			});
			if (catRes.error) {
				const err = catRes.error as { value?: { message?: string } };
				throw new Error(err?.value?.message ?? String(catRes.error));
			}
			const catPayload = catRes.data as { rows?: CategoryNavRow[] } | undefined;
			const categories = catPayload?.rows ?? [];

			const childCategories = categories.filter(isChildCategory);
			const categoryPool = childCategories.length > 0 ? childCategories : categories;
			const bottomChildren = categoryPool.filter(isBottomCategory);
			const topChildren = categoryPool.filter((c) => !isBottomCategory(c));
			

			let categoryIds: string[] = [];
			let resolvedTitle = '';

			if (handle === 'all-tops') {
				categoryIds = expandCategoryIds(
					topChildren.map((c) => c.id),
					categories
				);
				resolvedTitle = 'All Tops';
			} else if (handle === 'all-bottoms') {
				categoryIds = expandCategoryIds(
					bottomChildren.map((c) => c.id),
					categories
				);
				resolvedTitle = 'All Bottoms';
			} else {
				const category = categories.find((c) => c.handle === handle);
				if (!category) {
					return {
						rows: [],
						pagination: emptyPagination(),
						categoryTitle: handle,
						categoryNotFound: true
					};
				}
				categoryIds = expandCategoryIds([category.id], categories);
				resolvedTitle = category.value;
			}

			if (categoryIds.length === 0) {
				return {
					rows: [],
					pagination: emptyPagination(),
					categoryTitle: resolvedTitle || handle,
					categoryNotFound: false
				};
			}

			const root = API_BASE.replace(/\/admin\/?$/, '');
			const pq = productsListQuery(page.url) as Record<string, string>;
			const pageStr = pq.page != null && String(pq.page) !== '' ? String(pq.page) : '1';
			const limitStr =
				pq.limit != null && String(pq.limit) !== '' ? String(pq.limit) : '24';
			const sortKey = page.url.searchParams.get('sort') ?? 'best-selling';
			const sortCfg = STOREFRONT_SORT[sortKey] ?? STOREFRONT_SORT['best-selling'];
			const sp = new URLSearchParams({
				page: pageStr,
				limit: limitStr,
				sorting_field: sortCfg.field,
				sorting_direction: sortCfg.dir
			});
			sp.set('filters', JSON.stringify({ category_ids: categoryIds.join(',') }));
			const pres = await fetch(`${root}/storefront/products?${sp}`, {
				cache: 'no-store'
			});
			if (!pres.ok) {
				throw new Error('Failed to load category products');
			}
			const raw = (await pres.json()) as unknown;
			const { rows: productRows } = rowsFromPaginated<StorefrontProductRow>(raw);
			const pagination =
				(raw as { pagination?: PaginationMeta }).pagination ?? emptyPagination();
			const grid = productRows.map((p, i) => {
				const pr = p.variant?.price;
				const amount =
					pr?.amount != null ? parseInt(pr.amount, 10) / 100 : Number.NaN;
				const currency_code = pr?.currency_code ?? 'USD';
				return {
					name: p.title,
					price: {
						amount: Number.isFinite(amount) ? amount : Number.NaN,
						currency_code
					},
					href: `/products/${p.handle}`,
					bg: pickBg(i),
					image: p.thumbnail ?? p.variant?.thumbnail ?? null
				};
			});
			return {
				rows: grid as unknown as unknown as ProductGridItem[],
				pagination,
				categoryTitle: resolvedTitle,
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
const pageData = $derived.by((): CategoryPageData | null => {
	const raw = query.data as CategoryPageData | Array<CategoryPageData | null> | null | undefined;
	if (Array.isArray(raw)) {
		return raw.find((entry): entry is CategoryPageData => entry != null) ?? null;
	}
	return raw ?? null;
});
const rows = $derived.by((): ProductGridItem[] => pageData?.rows ?? []);
	const productCount = $derived((pagination?.total ?? 0) > 0 ? (pagination?.total ?? 0) : rows.length);
const categoryNotFound = $derived(pageData?.categoryNotFound === true);
	const categoryTitle = $derived(
	pageData?.categoryTitle ?? page.params.handle ?? 'Category'
	);
	const currentSort = $derived(page.url.searchParams.get('sort') ?? 'best-selling');
	const currentAvailability = $derived(page.url.searchParams.get('availability') ?? 'all');
	const currentPrice = $derived(page.url.searchParams.get('price') ?? 'all');
	const currentColor = $derived(page.url.searchParams.get('color') ?? 'all');
	const storeName = $derived(page.data?.storeName ?? 'Store');
	
</script>

<svelte:head>
	<title>{categoryTitle} – {storeName}</title>
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
		<CatalogToolbar
			loading={loading}
			start={start}
			end={end}
			total={pagination?.total ?? 0}
			totalPages={pagination?.total_pages ?? 0}
			page={pagination?.page ?? 1}
			hasNextPage={pagination?.has_next_page ?? false}
			hasPreviousPage={pagination?.has_previous_page ?? false}
			productCount={productCount}
			currentSort={currentSort}
			currentAvailability={currentAvailability}
			currentPrice={currentPrice}
			currentColor={currentColor}
			sortOptions={sortOptions}
			onSort={applySort}
			onAvailability={applyAvailability}
			onPrice={applyPrice}
			onColor={applyColor}
			onPrevious={() => goToPage((pagination?.page ?? 1) - 1)}
			onNext={() => goToPage((pagination?.page ?? 1) + 1)}
		/>
		<ProductGridSection products={rows} title="" subtitle="" />
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
	.category-error {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1.5rem;
		color: #c00;
		text-align: center;
	}
</style>
