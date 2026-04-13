<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { ProductGridSection } from '$lib/components/sections';
	import CatalogToolbar from '$lib/components/sections/CatalogToolbar.svelte';
	import { API_BASE, firstVariantIdByProductIds } from '$lib/api/storefront-api';
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
	
	type ProductRow = {
		id: string;
		title: string;
		handle: string;
		thumbnail?: string | null;
		variants?: Array<{ id?: string }>;
	};
	type CollectionRow = { id: string; title: string; handle?: string; slug?: string };
	type GridProduct = {
		name: string;
		price: string;
		href: string;
		bg: string;
		image?: string | null;
	};
	type ApiVariant = {
		prices?: Array<{ amount: string; currency_code: string }>;
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
	async function fetchVariantPrice(
		apiBase: string,
		variantId: string
	): Promise<{ amount: number; currency_code: string } | null> {
		try {
			const res = await fetch(`${apiBase}/product-variants/${variantId}`, { cache: 'no-store' });
			if (!res.ok) return null;
			const data = (await res.json()) as ApiVariant;
			const first = data.prices?.[0];
			if (!first) return null;
			const amount = parseInt(first.amount, 10) / 100;
			return { amount, currency_code: first.currency_code };
		} catch {
			return null;
		}
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
			const productsRes = await client.products.get({
				query: {
					...createPaginationQuery(new SvelteURLSearchParams(page.url.search)),
					filters: {
						collection_ids: [collection.id]
					}
				}
			});
			if (productsRes.error) {
				const err = productsRes.error as { value?: { message?: string } };
				throw new Error(err?.value?.message ?? String(productsRes.error));
			}
			const payload = productsRes.data as { rows?: ProductRow[]; pagination?: PaginationMeta } | undefined;
			const productRows = payload?.rows ?? [];
			const variantMap = await firstVariantIdByProductIds(
				API_BASE,
				productRows.map((p) => p.id)
			);
			const variantIds = productRows
				.map((p) => p.variants?.[0]?.id ?? variantMap.get(p.id))
				.filter((id): id is string => !!id);
			const prices = await Promise.all(variantIds.map((id) => fetchVariantPrice(API_BASE, id)));
			let priceIndex = 0;
			const gridRows: GridProduct[] = productRows.map((p, i) => {
				const firstVariantId = p.variants?.[0]?.id ?? variantMap.get(p.id);
				let price = '—';
				if (firstVariantId && priceIndex < prices.length) {
					const pr = prices[priceIndex];
					priceIndex++;
					if (pr) {
						price =
							pr.currency_code === 'USD'
								? `$${pr.amount.toFixed(2)}`
								: `${pr.currency_code.toUpperCase()} ${pr.amount.toFixed(2)}`;
					}
				}
				return {
					name: p.title,
					price,
					href: `/products/${p.handle}`,
					bg: pickBg(i),
					image: p.thumbnail ?? null
				};
			});
			return {
				rows: gridRows,
				pagination: payload?.pagination ?? emptyPagination(),
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
	const rows = $derived((query.data?.rows ?? []) as GridProduct[]);
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
		<ProductGridSection products={gridProducts as unknown as ProductGridItem[] | undefined} title="" subtitle="" />
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
