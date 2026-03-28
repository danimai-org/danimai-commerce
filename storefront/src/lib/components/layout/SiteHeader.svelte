<script lang="ts">
	import { cart } from '$lib/stores/cart';
	import { search } from '$lib/stores/search';
	import SearchSheet from '$lib/components/search/SearchSheet.svelte';
	import { createPagination, createPaginationQuery, type PaginationMeta } from '$lib/api/pagination.svelte';
	import { client } from '$lib/api/client.js';

	type CategoryRow = {
		id: string;
		value: string;
		handle: string;
		parent_id: string | null;
	};

	type CollectionRow = {
		id: string;
		title: string;
		handle: string;
	};

	let cartCount = $state(0);
	let searchOpen = $state(false);

	$effect(() => {
		const unsub = cart.subscribe((s) => {
			cartCount = s.items.reduce((n, i) => n + i.quantity, 0);
		});
		return unsub;
	});
	$effect(() => {
		const unsub = search.subscribe((s) => {
			searchOpen = s.open;
		});
		return unsub;
	});

	const NAV_PARAMS = new URLSearchParams({ page: '1', limit: '100' });

	function emptyPagination(): PaginationMeta {
		return {
			total: 0,
			page: 1,
			limit: 100,
			total_pages: 0,
			has_next_page: false,
			has_previous_page: false
		};
	}

	function unwrapRows<T>(data: unknown): T[] {
		if (!data || typeof data !== 'object') return [];
		const o = data as Record<string, unknown>;
		if (Array.isArray(o.rows)) return o.rows as T[];
		if (o.data && typeof o.data === 'object') {
			const inner = o.data as Record<string, unknown>;
			if (Array.isArray(inner.rows)) return inner.rows as T[];
		}
		return [];
	}

	function unwrapPagination(data: unknown): PaginationMeta | null {
		if (!data || typeof data !== 'object') return null;
		const o = data as Record<string, unknown>;
		if (o.pagination && typeof o.pagination === 'object') return o.pagination as PaginationMeta;
		if (o.data && typeof o.data === 'object') {
			const inner = o.data as Record<string, unknown>;
			if (inner.pagination && typeof inner.pagination === 'object') return inner.pagination as PaginationMeta;
		}
		return null;
	}

	const productCategoriesState = createPagination(
		async () => {
			const res = await client['product-categories'].get({
				query: createPaginationQuery(NAV_PARAMS)
			});
			if (res.error) {
				return { rows: [] as CategoryRow[], pagination: emptyPagination() };
			}
			const body = res.data as unknown;
			return {
				rows: unwrapRows<CategoryRow>(body),
				pagination: unwrapPagination(body) ?? emptyPagination()
			};
		},
		['product-categories'],
		createPaginationQuery(NAV_PARAMS),
		{ keySuffix: () => ['nav'] }
	);

	const collectionsState = createPagination(
		async () => {
			const res = await client['collections'].get({
				query: createPaginationQuery(NAV_PARAMS)
			});
			if (res.error) {
				return { rows: [] as CollectionRow[], pagination: emptyPagination() };
			}
			const body = res.data as unknown;
			return {
				rows: unwrapRows<CollectionRow>(body),
				pagination: unwrapPagination(body) ?? emptyPagination()
			};
		},
		['collections'],
		createPaginationQuery(NAV_PARAMS),
		{ keySuffix: () => ['nav'] }
	);

	const { query: productCategoriesQuery } = productCategoriesState;
	const { query: collectionsQuery } = collectionsState;

	const productCategories = $derived((productCategoriesQuery.data?.rows ?? []) as CategoryRow[]);
	const navCollections = $derived((collectionsQuery.data?.rows ?? []) as CollectionRow[]);

	const childCategories = $derived(productCategories.filter((c) => c.parent_id !== null));
	const bottoms = $derived(
		childCategories.filter((c) => /pants|trousers|shorts|skirts|denim/i.test(c.value))
	);
	const tops = $derived(
		childCategories.filter((c) => !/pants|trousers|shorts|skirts|denim/i.test(c.value))
	);
</script>

<header class="site-header">
	<div class="announcement">Free shipping available on all orders</div>
	<nav class="nav">
		<a href="/" class="brand">ESSENTIALS</a>
		<ul class="nav-links">
			<li class="nav-dropdown">
				<button type="button" class="nav-dropdown-item">
					Shop <span class="caret">▼</span>
				</button>
				<div class="dropdown-menu" aria-hidden="true">
					<a href="/categories/all-tops">All Tops</a>
					{#each tops as top}
						<a href="/categories/{top.handle}">{top.value}</a>
					{/each}
					<a href="/categories/all-bottoms">All Bottoms</a>
					{#each bottoms as bottom}
						<a href="/categories/{bottom.handle}">{bottom.value}</a>
					{/each}
					<a href="/store">Shop all</a>
					{#each navCollections as col}
						<a href="/collections/{col.handle}">{col.title}</a>
					{/each}
				</div>
			</li>
		</ul>
		<div class="nav-actions">
			{#if searchOpen}
				<SearchSheet />
			{:else}
				<button type="button" class="icon-btn" aria-label="Search" onclick={() => search.open()}>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
				</button>
			{/if}
			<button type="button" class="icon-btn" aria-label="Account">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
			</button>
			<button type="button" class="icon-btn cart-btn" aria-label="Cart" onclick={() => cart.open()}>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
				{#if cartCount > 0}
					<span class="cart-badge">{cartCount}</span>
				{/if}
			</button>
		</div>
	</nav>
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: #fff;
		overflow: visible;
	}
	.announcement {
		text-align: center;
		padding: 0.5rem 1rem;
		font-size: 0.8125rem;
		color: #4a4a4a;
		background: #f5f5f5;
	}
	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 1.5rem;
		gap: 2rem;
	}
	.brand {
		font-weight: 700;
		font-size: 1.25rem;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: #1a1a1a;
		text-decoration: none;
		flex-shrink: 0;
	}
	.nav-links {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: 2rem;
		flex: 1;
		justify-content: center;
	}
	.nav-links a {
		color: #1a1a1a;
		text-decoration: none;
		font-size: 0.9375rem;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.nav-dropdown {
		position: relative;
	}
	button.nav-dropdown-item {
		font: inherit;
		background: none;
		border: none;
		cursor: pointer;
		color: #1a1a1a;
		font-size: 0.9375rem;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0;
	}
	.nav-dropdown .dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 0.25rem;
		min-width: 160px;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		padding: 0.5rem 0;
		opacity: 0;
		visibility: hidden;
		transform: translateY(-4px);
		transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
		z-index: 100;
	}
	.nav-dropdown:hover .dropdown-menu,
	.nav-dropdown:focus-within .dropdown-menu {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
	}
	.nav-dropdown .dropdown-menu a {
		display: block;
		padding: 0.5rem 1rem;
		font-size: 0.9375rem;
		white-space: nowrap;
		border-radius: 4px;
		margin: 0 0.25rem;
	}
	.nav-dropdown .dropdown-menu a:hover {
		background: #f5f5f5;
	}
	.caret {
		font-size: 0.6em;
		opacity: 0.8;
	}
	.nav-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-shrink: 0;
		position: relative;
	}
	.icon-btn {
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: #1a1a1a;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.cart-btn {
		position: relative;
	}
	.cart-badge {
		position: absolute;
		top: -2px;
		right: -2px;
		min-width: 1.125rem;
		height: 1.125rem;
		padding: 0 4px;
		font-size: 0.6875rem;
		font-weight: 600;
		line-height: 1.125rem;
		text-align: center;
		background: #1a1a1a;
		color: #fff;
		border-radius: 999px;
	}
</style>
