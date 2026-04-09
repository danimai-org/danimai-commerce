<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { ProductGridSection } from '$lib/components/sections';
	import {
		createPagination,
		createPaginationQuery,
		type PaginationMeta
	} from '$lib/api/pagination.svelte';
	import { client } from '$lib/api/client.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	type ProductRow = { id: string; title: string; handle: string };

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
			const queryParams = {
				...createPaginationQuery(new SvelteURLSearchParams(page.url.search)),
			
				filters: {
					handle: page.params.handle ?? '',
				}
			};
			const res = await client['collections'].get({
				query: queryParams
			});
			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				throw new Error(err?.value?.message ?? String(res.error));
			}
			const payload = res.data as { rows?: ProductRow[]; pagination?: PaginationMeta } | undefined;
			return {
				rows: payload?.rows ?? [],
				pagination: payload?.pagination ?? emptyPagination()
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
	const rows = $derived((query.data?.rows ?? []) as ProductRow[]);
	const pagination = $derived(paginateState.pagination);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
const activeHandle = $derived((page.params.handle ?? '').toLowerCase());
const matchedRows = $derived(
	rows.filter((row) => slugify(row.title) === activeHandle || slugify(row.handle) === activeHandle)
);
const pageRows = $derived(matchedRows.length > 0 ? matchedRows : rows);
const heroTitle = $derived(
	pageRows[0]?.title ?? (activeHandle ? prettyHandle(activeHandle) : 'Collection')
);

	const gridProducts = $derived(
	pageRows.map((p, i) => ({
			name: p.title,
			price: '—',
			href: `/products/${p.handle}`,
			bg: pickBg(i),
			image: null as string | null
		}))
	);

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
		<section class="collection-hero">
			<h1 class="collection-hero-title">{heroTitle}</h1>
		</section>
		<div class="collection-toolbar" aria-live="polite">
			{#if loading}
				<span class="collection-loading">Loading…</span>
			{/if}
			{#if pageRows.length > 0}
				<span class="collection-range">
					{#if matchedRows.length > 0}
						1–{pageRows.length} of {pageRows.length}
					{:else if pagination && pagination.total > 0}
						{start}–{end} of {pagination.total}
					{:else}
						1–{pageRows.length} of {pageRows.length}
					{/if}
				</span>
			{/if}
			{#if matchedRows.length === 0 && pagination && pagination.total_pages > 1}
				<div class="collection-pagination">
					<button
						type="button"
						class="collection-page-btn"
						disabled={loading || !pagination.has_previous_page}
						onclick={() => goToPage(pagination.page - 1)}
					>
						Previous
					</button>
					<span class="collection-page-num">Page {pagination.page} of {pagination.total_pages}</span>
					<button
						type="button"
						class="collection-page-btn"
						disabled={loading || !pagination.has_next_page}
						onclick={() => goToPage(pagination.page + 1)}
					>
						Next
					</button>
				</div>
			{/if}
		</div>
		<ProductGridSection products={gridProducts} title="" subtitle="" />
	</main>
{/if}

<SiteFooter />

<style>
	.collection-main {
		min-height: 40vh;
	}
	.collection-hero {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		background: linear-gradient(180deg, #e8e0d5 0%, #d4c8bc 100%);
		padding: 3rem 1.5rem;
	}
	.collection-hero-title {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		color: #fff;
		text-align: center;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
	.collection-error {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1.5rem;
		color: #c00;
		text-align: center;
	}
	.collection-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 1rem 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 1.5rem 0;
		font-size: 0.875rem;
		color: #555;
	}
	.collection-loading {
		color: #666;
	}
	.collection-range {
		margin: 0 auto;
	}
	.collection-pagination {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.collection-page-btn {
		padding: 0.35rem 0.75rem;
		font-size: 0.875rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: #fff;
		cursor: pointer;
	}
	.collection-page-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.collection-page-num {
		color: #666;
	}
</style>
