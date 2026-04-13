<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { ProductGridSection } from '$lib/components/sections';
	import CatalogToolbar from '$lib/components/sections/CatalogToolbar.svelte';
	import { API_BASE, rowsFromPaginated } from '$lib/api/storefront-api';
	import {
		createPagination,
		createPaginationQuery,
		type PaginationMeta
	} from '$lib/api/pagination.svelte';
	import { client } from '$lib/api/client.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { ProductGridItem } from '../../store/+page.ts';
	type CollectionRow = { id: string; title: string; handle?: string; slug?: string };
	type StorefrontProductRow = {
		title: string;
		handle: string;
		variant: {
			thumbnail: string | null;
			price: { amount: string; currency_code: string } | null;
		} | null;
	};
	const FALLBACK_BGS = ['#e8e0d5', '#4a4a4a', '#f5f0eb', '#6b7c5c'];
	function pickBg(index: number) {
		return FALLBACK_BGS[index % FALLBACK_BGS.length];
	}
function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
function prettyHandle(handle: string): string {
	return handle
		.split('-')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}
	function emptyPagination(): PaginationMeta {
		return {
			total: 0,
			page: 1,
			limit: 10,
			total_pages: 0,
			has_next_page: false,
			has_previous_page: false
		};
	}
	const paginateState = createPagination(
		async () => {
			const requestedHandle = (page.params.handle ?? '').trim().toLowerCase();
			const collectionRes = await client['collections'].get({
				query: {
					...createPaginationQuery(new URLSearchParams({ page: '1', limit: '100' }))
				}
			});
			if (collectionRes.error) {
				const err = collectionRes.error as { value?: { message?: string } };
				throw new Error(err?.value?.message ?? String(collectionRes.error));
			}
			const collectionPayload = collectionRes.data as { rows?: CollectionRow[] } | undefined;
			const collectionRows = collectionPayload?.rows ?? [];
			const collection =
				collectionRows.find((row) => {
					const byHandle = (row.handle ?? '').trim().toLowerCase();
					const bySlug = (row.slug ?? '').trim().toLowerCase();
					const byTitle = slugify(row.title ?? '');
					return requestedHandle === byHandle || requestedHandle === bySlug || requestedHandle === byTitle;
				}) ?? null;
			if (!collection?.id) {
				return {
					rows: [],
					pagination: emptyPagination(),
					collectionTitle: prettyHandle(requestedHandle)
				};
			}
			const root = API_BASE.replace(/\/admin\/?$/, '');
			const pq = createPaginationQuery(new SvelteURLSearchParams(page.url.search));
			const pageStr =
				pq.page != null && String(pq.page) !== '' ? String(pq.page) : '1';
			const limitStr =
				pq.limit != null && String(pq.limit) !== '' ? String(pq.limit) : '10';
			const sp = new URLSearchParams({
				page: pageStr,
				limit: limitStr,
				sorting_field: 'products.title',
				sorting_direction: 'asc'
			});
			sp.set('filters[collection_ids]', collection.id);
			const productsRes = await fetch(`${root}/storefront/products?${sp}`, {
				cache: 'no-store'
			});
			if (!productsRes.ok) {
				throw new Error('Failed to load collection products');
			}
			const raw = (await productsRes.json()) as unknown;
			const { rows: productRows } = rowsFromPaginated<StorefrontProductRow>(raw);
			const pagination =
				(raw as { pagination?: PaginationMeta }).pagination ?? emptyPagination();
			const gridRows: ProductGridItem[] = productRows.map((p, i) => {
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
					image: p.variant?.thumbnail ?? null
				};
			});
			return {
				rows: gridRows,
				pagination,
				collectionTitle: collection.title
			};
		},
		['collection-products'],
		createPaginationQuery(new SvelteURLSearchParams(page.url.search)),
		{
			keySuffix: () => [page.params.handle ?? '']
		}
	);
	const { query } = paginateState;

	const loading = $derived(paginateState.loading);
	const fetchError = $derived(paginateState.error);
	const rows = $derived((query.data?.rows ?? []) as ProductGridItem[]);
	const pagination = $derived(paginateState.pagination);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
const activeHandle = $derived((page.params.handle ?? '').toLowerCase());
const pageRows = $derived(rows);
const heroTitle = $derived(
	query.data?.collectionTitle ?? (activeHandle ? prettyHandle(activeHandle) : 'Collection')
);
const sortOptions = [
	{ value: 'best-selling', label: 'Best selling' },
	{ value: 'newest', label: 'Newest' },
	{ value: 'title-asc', label: 'Title A-Z' },
	{ value: 'title-desc', label: 'Title Z-A' }
];
const productCount = $derived((pagination?.total ?? 0) > 0 ? (pagination?.total ?? 0) : pageRows.length);

	const gridProducts = $derived(pageRows);

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

	const currentSort = $derived(page.url.searchParams.get('sort') ?? 'best-selling');
	const currentAvailability = $derived(page.url.searchParams.get('availability') ?? 'all');
	const currentPrice = $derived(page.url.searchParams.get('price') ?? 'all');
	const currentColor = $derived(page.url.searchParams.get('color') ?? 'all');

	function goToPage(nextPage: number) {
		const u = new URL(page.url);
		u.searchParams.set('page', String(nextPage));
		goto(u.toString());
	}
</script>

<SiteHeader />

{#if fetchError}
	<main class="collection-main">
		<p class="collection-error">{fetchError}</p>
	</main>
{:else}
	<main class="collection-main">
		<section class="collection-hero" aria-label={heroTitle}>
			<h1 class="collection-hero-title">{heroTitle}</h1>
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
		<ProductGridSection products={gridProducts} title="" subtitle="" />
	</main>
{/if}

<SiteFooter />

<style>
	.collection-main {
		min-height: 40vh;
	}
	.collection-hero {
		background: #e8e0d5;
		padding: clamp(2.25rem, 5vw, 3.25rem) 1.5rem;
		box-sizing: border-box;
		text-align: center;
	}
	.collection-hero-title {
		margin: 0 auto;
		max-width: 1200px;
		font-size: clamp(2rem, 4vw, 2.75rem);
		font-weight: 700;
		color: #ffffff;
		letter-spacing: 0.02em;
	}
	.collection-error {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1.5rem;
		color: #c00;
		text-align: center;
	}
</style>
