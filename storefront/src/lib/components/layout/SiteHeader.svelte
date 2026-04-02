<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { cart } from '$lib/stores/cart';
	import { search } from '$lib/stores/search';
	import SearchSheet from '$lib/components/search/SearchSheet.svelte';
	import { createPagination, createPaginationQuery, type PaginationMeta } from '$lib/api/pagination.svelte';

	import { client } from '$lib/api/client.js';
	import {
		type CategoryNavRow,
		isBottomCategory,
		isChildCategory
	} from '$lib/category-nav';

	type CategoryRow = CategoryNavRow;

	type CollectionRow = {
		id: string;
		title: string;
		handle: string;
	};

	let cartCount = $state(0);
	let searchOpen = $state(false);
	let menuOpen = $state(false);
	let accountMenuOpen = $state(false);
	let navWide = $state(false);


	afterNavigate(() => {
		menuOpen = false;
		accountMenuOpen = false;
	});

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(min-width: 768px)');
		const set = () => {
			navWide = mq.matches;
		};
		set();
		mq.addEventListener('change', set);
		return () => mq.removeEventListener('change', set);
	});

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

	const childCategories = $derived(productCategories.filter(isChildCategory));
	const bottoms = $derived(childCategories.filter(isBottomCategory));
	const tops = $derived(childCategories.filter((c) => !isBottomCategory(c)));

	$effect(() => {
		if (!menuOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') menuOpen = false;
		};
		document.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = prev;
			document.removeEventListener('keydown', onKey);
		};
	});

	$effect(() => {
		if (!accountMenuOpen) return;
		const onDocClick = () => {
			accountMenuOpen = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') accountMenuOpen = false;
		};
		document.addEventListener('click', onDocClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('click', onDocClick);
			document.removeEventListener('keydown', onKey);
		};
	});
</script>

<header class="site-header">
	<nav class="nav" class:nav--mobile-search-open={searchOpen && !navWide}>
		<a href="/" class="brand">DENIMAI</a>
		<ul class="nav-links nav-links--desktop">
			<li class="nav-dropdown">
				<button type="button" class="nav-item">
					Tops
					<svg class="chevron" width="10" height="10" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
				</button>
				<div class="dropdown-menu" aria-hidden="true">
					<a href="/categories/all-tops">All Tops</a>
					{#each tops as top}

						<a href="/categories/{top.handle}">{top.value}</a>
					{/each}
				</div>
			</li>
			<li class="nav-dropdown">
				<button type="button" class="nav-item">
					Bottoms
					<svg class="chevron" width="10" height="10" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
				</button>
				<div class="dropdown-menu" aria-hidden="true">
					<a href="/categories/all-bottoms">All Bottoms</a>
					{#each bottoms as bottom}
						<a href="/categories/{bottom.handle}">{bottom.value}</a>
					{/each}
				</div>
			</li>
			<li class="nav-dropdown">
				<button type="button" class="nav-item">
					Collections
					<svg class="chevron" width="10" height="10" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
				</button>
				<div class="dropdown-menu" aria-hidden="true">
					{#each navCollections as col}
						<a href="/collections/{col.handle}">{col.title}</a>
					{/each}
					{#if navCollections.length === 0}
						<a href="/store">Shop all</a>
					{/if}
				</div>
			</li>
			<li>
				<a href="/about" class="nav-item nav-link-plain">About</a>
			</li>
		</ul>
		<div class="nav-end" class:nav-end--search-open={searchOpen && !navWide}>
			{#if navWide}
				<SearchSheet persistent={true} />
			{:else if !searchOpen}
				<button
					type="button"
					class="icon-btn"
					aria-label="Search"
					onclick={() => {
						menuOpen = false;
						accountMenuOpen = false;
						search.open();
					}}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
				</button>
			{/if}
			<div class="nav-actions-icons">
				<div class="nav-account-wrap">
					<button
						type="button"
						class="icon-btn icon-btn--account"
						aria-label="Account"
						aria-expanded={accountMenuOpen}
						aria-haspopup="true"
						onclick={(e) => {
							e.stopPropagation();
							accountMenuOpen = !accountMenuOpen;
						}}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
					</button>
					{#if accountMenuOpen}
						<div class="account-dropdown" role="menu" aria-label="Account">
							<a
								href="/login"
								class="account-dropdown-link"
								role="menuitem"
								onclick={() => (accountMenuOpen = false)}>Login</a>
									
						</div>
					{/if}
				</div>
				<button
					type="button"
					class="icon-btn cart-btn"
					aria-label="Cart"
					onclick={() => {
						menuOpen = false;
						accountMenuOpen = false;
						cart.open();
					}}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
					{#if cartCount > 0}
						<span class="cart-badge">{cartCount}</span>
					{/if}
				</button>
				<button
					type="button"
					class="icon-btn menu-trigger"
					aria-label="Open menu"
					aria-expanded={menuOpen}
					onclick={() => (menuOpen = !menuOpen)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
				</button>
			</div>
		</div>
	</nav>
	{#if searchOpen && !navWide}
		<div class="nav-mobile-search">
			<SearchSheet persistent={false} />
		</div>
	{/if}
</header>

{#if menuOpen}
	<button
		type="button"
		class="drawer-backdrop"
		aria-label="Close menu"
		onclick={() => (menuOpen = false)}
	></button>
	<aside class="mobile-drawer" aria-label="Site menu">
		<div class="drawer-header">
			<span class="drawer-title">Menu</span>
			<button type="button" class="drawer-close" aria-label="Close menu" onclick={() => (menuOpen = false)}>
				<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
			</button>
		</div>
		<nav class="drawer-nav">
			<section class="drawer-section">
				<h2 class="drawer-cat">Tops</h2>
				<a href="/categories/all-tops" class="drawer-link" onclick={() => (menuOpen = false)}>All Tops</a>
				{#each tops as top}
					<a href="/categories/{top.handle}" class="drawer-link" onclick={() => (menuOpen = false)}>{top.value}</a>
				{/each}
			</section>
			<section class="drawer-section">
				<h2 class="drawer-cat">Bottoms</h2>
				<a href="/categories/all-bottoms" class="drawer-link" onclick={() => (menuOpen = false)}>All Bottoms</a>
				{#each bottoms as bottom}
					<a href="/categories/{bottom.handle}" class="drawer-link" onclick={() => (menuOpen = false)}>{bottom.value}</a>
				{/each}
			</section>
			<section class="drawer-section">
				<h2 class="drawer-cat">Collections</h2>
				{#each navCollections as col}
					<a href="/collections/{col.handle}" class="drawer-link" onclick={() => (menuOpen = false)}>{col.title}</a>
				{/each}
				{#if navCollections.length === 0}
					<a href="/store" class="drawer-link" onclick={() => (menuOpen = false)}>Shop all</a>
				{/if}
			</section>
			<a href="/about" class="drawer-link drawer-link--standalone" onclick={() => (menuOpen = false)}>About</a>
			<section class="drawer-section">
				<h2 class="drawer-cat">Account</h2>
				<a href="/login" class="drawer-link" onclick={() => (menuOpen = false)}>Login</a>
				<a href="/register" class="drawer-link" onclick={() => (menuOpen = false)}>Register</a>
			</section>
		</nav>
	</aside>
{/if}

<style>
	.site-header {
		--header-bg: #fff;
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--header-bg);
		overflow: visible;
	}
	.nav-mobile-search {
		padding: 0 var(--section-padding-x, 1.5rem) 0.75rem;
		box-sizing: border-box;
		background: var(--header-bg);
		border-bottom: 1px solid #e8e8e8;
	}
	@media (min-width: 768px) {
		.nav-mobile-search {
			display: none;
		}
	}
	.nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: var(--section-max-width, 1200px);
		margin: 0 auto;
		padding: 0.75rem var(--section-padding-x, 1.5rem);
		gap: 1rem;
		box-sizing: border-box;
	}
	@media (min-width: 768px) {
		.nav {
			display: grid;
			grid-template-columns: auto 1fr auto;
			justify-content: initial;
			align-items: center;
		}
	}
	.brand {
		justify-self: start;
		flex-shrink: 0;
		font-weight: 700;
		font-size: 1.125rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #1a1a1a;
		text-decoration: none;
	}
	.nav-links--desktop {
		display: none;
	}
	@media (min-width: 768px) {
		.nav-links--desktop {
			justify-self: center;
			display: flex;
			list-style: none;
			margin: 0;
			padding: 0;
			gap: 2.25rem;
			align-items: center;
		}
	}
	.nav-item {
		font: inherit;
		font-size: 0.9375rem;
		font-weight: 400;
		color: #5c5c5c;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0;
	}
	.nav-item:hover {
		color: #1a1a1a;
	}
	.nav-link-plain {
		cursor: pointer;
	}
	.chevron {
		flex-shrink: 0;
		opacity: 0.85;
	}
	.nav-dropdown {
		position: relative;
	}
	.nav-dropdown .dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 0;
		min-width: 160px;
		background: var(--header-bg);
		border-radius: 0;
		box-shadow: none;
		padding: 0.35rem 0 0.75rem;
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
		border-bottom-left-radius: 4px;
		border-bottom-right-radius: 4px;
	}
	.nav-dropdown .dropdown-menu a {
		display: block;
		padding: 0.5rem 1rem;
		font-size: 0.9375rem;
		white-space: nowrap;
		border-radius: 4px;
		margin: 0 0.25rem;
		color: #1a1a1a;
		text-decoration: none;
	}
	.nav-dropdown .dropdown-menu a:hover {
		background: #f5f5f5;
		color: #1a1a1a;
		text-decoration: none;
	
	}
	.nav-end {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		position: relative;
		min-width: 0;
	}
	.nav-actions-icons {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}
	@media (max-width: 767px) {
		.nav--mobile-search-open .nav-end {
			flex: 0 0 auto;
			width: auto;
		}
		.nav-end--search-open {
			justify-content: flex-end;
		}
	}
	@media (min-width: 768px) {
		.nav-end {
			justify-self: end;
			gap: 1.125rem;
		}
		.nav-actions-icons {
			gap: 1.125rem;
		}
	}
	.nav-account-wrap {
		position: relative;
		display: none;
	}
	@media (min-width: 768px) {
		.nav-account-wrap {
			display: block;
		}
	}
	.account-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.35rem;
		min-width: 10rem;
		padding: 0.35rem 0;
		background: #fff;
		border: 1px solid #e8e8e8;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
		z-index: 120;
	}
	.account-dropdown-link {
		display: block;
		padding: 0.5rem 1rem;
		font-size: 0.9375rem;
		color: #1a1a1a;
		text-decoration: none;
	}
	.account-dropdown-link:hover {
		background: #f5f5f5;
	}
	.menu-trigger {
		display: flex;
	}
	@media (min-width: 768px) {
		.menu-trigger {
			display: none;
		}
	}
	.icon-btn {
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: #2a2a2a;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.icon-btn:hover {
		color: #000;
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
	.drawer-backdrop {
		position: fixed;
		inset: 0;
		z-index: 180;
		border: none;
		padding: 0;
		margin: 0;
		background: rgba(0, 0, 0, 0.45);
		cursor: pointer;
	}
	.mobile-drawer {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: 190;
		width: min(82vw, 20rem);
		background: #fff;
		box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
		overflow: auto;
		animation: drawer-in 0.2s ease-out;
	}
	@keyframes drawer-in {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}
	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #e8e8e8;
		flex-shrink: 0;
	}
	.drawer-title {
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #1a1a1a;
	}
	.drawer-close {
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: #1a1a1a;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.drawer-nav {
		padding: 0.5rem 1.25rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}
	.drawer-section {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}
	.drawer-cat {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #1a1a1a;
	}
	.drawer-link {
		display: block;
		padding: 0.15rem 0 0.15rem 0.5rem;
		font-size: 0.9375rem;
		font-weight: 400;
		color: #2a2a2a;
		text-decoration: none;
		line-height: 1.5;
	}
	.drawer-link:hover {
		color: #000;
	}
	.drawer-link--standalone {
		padding-left: 0;
		font-weight: 500;
		margin-top: 0.25rem;
	}
	@media (min-width: 768px) {
		.drawer-backdrop,
		.mobile-drawer {
			display: none;
		}
	}
</style>
