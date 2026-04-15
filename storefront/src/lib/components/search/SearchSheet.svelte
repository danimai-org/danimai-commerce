<script lang="ts">
	import { goto } from '$app/navigation';
	import { API_BASE, firstVariantIdByProductIds, rowsFromPaginated } from '../../api/storefront-api';
	import { client } from '$lib/api/client.js';
	import { search } from '$lib/stores/search';
	type SearchResult = {
		name: string;
		price: string;
		href: string;
		bg: string;
		image?: string | null;
	};

	let { persistent = false }: { persistent?: boolean } = $props();

	let searchState = $state({ open: false });
	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let loading = $state(false);
	let inputEl = $state<HTMLInputElement | undefined>(undefined);
	let prevStoreOpen = false;

	const active = $derived(persistent || searchState.open);

	$effect(() => {
		const unsub = search.subscribe((s) => {
			searchState = { open: s.open };
		});
		return unsub;
	});

	$effect(() => {
		if (!active) return;
		const opened = searchState.open;
		if (opened && !prevStoreOpen && !persistent) {
			query = '';
			results = [];
		}
		prevStoreOpen = opened;
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			if (persistent) {
				query = '';
				results = [];
				inputEl?.blur();
			} else {
				search.close();
			}
		};
		document.addEventListener('keydown', onKey);
		if (searchState.open && !persistent) {
			requestAnimationFrame(() => inputEl?.focus());
		}
		return () => document.removeEventListener('keydown', onKey);
	});

	let debounceId = 0;
	$effect(() => {
		const q = query.trim();
		clearTimeout(debounceId);
		if (!active) return;
		if (!q) {
			results = [];
			return;
		}
		debounceId = window.setTimeout(() => fetchResults(q), 200);
		return () => clearTimeout(debounceId);
	});

	async function fetchResults(q: string) {
		loading = true;
		try {
			const res = await client.admin.products.get({
				query: {
					search: q,
					limit: '20',
					page: '1'
				}
			});
			if (res.error) {
				results = [];
				return;
			}
			const raw = res.data as unknown;
			const { rows: list } = rowsFromPaginated<{
				id: string;
				title: string;
				handle: string;
				thumbnail?: string | null;
				variants?: Array<{ id: string }>;
			}>(raw);
			const variantMap = await firstVariantIdByProductIds(
				API_BASE,
				list.map((p) => p.id)
			);
			const variantIds = list
				.map((p) => p.variants?.[0]?.id ?? variantMap.get(p.id))
				.filter((id): id is string => !!id);
			type PriceObj = { amount: string; currency_code: string } | null;
			const prices: PriceObj[] = await Promise.all(
				variantIds.map((id) =>
					client.admin['product-variants']({ id }).get().then((r: any) => (r.error ? null : r.data))
						.then((variant: any) => variant?.prices?.[0] ?? null)
						.catch(() => null)
				)
			);
			results = list.map((p, i) => ({
				name: p.title,
				price: prices[i]?.amount ?? '',
				href: `/products/${p.handle}`,
				bg: '#f5f0eb',
				image: p.thumbnail || null
			}));
		} catch {
			results = [];
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		search.close();
	}

	function clearInput() {
		query = '';
		results = [];
		inputEl?.focus();
	}

	function goToProduct(href: string) {
		if (!persistent) search.close();
		goto(href);
	}
</script>

{#if active}
	<div class="search-bar-wrap" class:search-bar-wrap--persistent={persistent}>
		<div class="search-bar-row">
			{#if persistent}
				<div class="search-bar search-bar--desktop">
					<input
						bind:this={inputEl}
						type="search"
						class="search-input"
						placeholder="Search"
						aria-label="Search products"
						bind:value={query}
						autocomplete="off"
					/>
					<button type="button" class="search-icon-inset" aria-label="Search" onclick={() => inputEl?.focus()}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
					</button>
				</div>
			{:else}
				<div class="search-bar search-bar--mobile">
					<button type="button" class="search-icon-lead" aria-label="Search" onclick={() => inputEl?.focus()}>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
					</button>
					<input
						bind:this={inputEl}
						type="search"
						class="search-input search-input--mobile"
						placeholder="Search for products..."
						aria-label="Search for products"
						bind:value={query}
						autocomplete="off"
					/>
					<button type="button" class="search-close-inline" aria-label="Close search" onclick={handleClose}>
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
					</button>
				</div>
			{/if}
		</div>
		{#if loading}
			<div class="search-dropdown">
				<p class="search-status">Searching…</p>
			</div>
		{:else if query.trim() && results.length === 0}
			<div class="search-dropdown">
				<p class="search-status">No products found.</p>
			</div>
		{:else if results.length > 0}
			<div class="search-dropdown">
				<ul class="search-results">
					{#each results as item (item.href)}
						<li>
							<button
								type="button"
								class="result-item"
								onclick={() => goToProduct(item.href)}
							>
								<div class="result-image" style="background-color: #f5f0eb;">
									{#if item.image}
										<img src={item.image} alt="" />
									{/if}
								</div>
								<div class="result-details">
									<span class="result-name">{item.name}</span>
									<span class="result-price">{item.price}</span>
								</div>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{/if}

<style>
	.search-bar-wrap {
		position: relative;
		flex: 1;
		min-width: 0;
		max-width: 100%;
		width: 100%;
	}
	.search-bar-wrap--persistent {
		width: 100%;
		max-width: 20rem;
		flex: 1 1 12rem;
	}
	@media (min-width: 768px) {
		.search-bar-wrap--persistent {
			max-width: 22rem;
		}
	}
	.search-bar-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
		width: 100%;
	}
	.search-bar--desktop {
		position: relative;
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
		height: 40px;
		padding: 0 0.35rem 0 0.75rem;
		background: #fff;
		border: 1px solid #1a1a1a;
		border-radius: 2px;
		box-sizing: border-box;
	}
	.search-bar--mobile {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
		width: 100%;
		height: 44px;
		padding: 0 0.75rem 0 0.75rem;
		background: #ebebeb;
		border: 1px solid #d8d8d8;
		border-radius: 4px;
		box-sizing: border-box;
	}
	.search-input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		font-size: 0.875rem;
		color: #1a1a1a;
		padding: 0 0.25rem 0 0;
	}
	.search-input--mobile {
		background: transparent;
	}
	.search-icon-lead {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: none;
		border: none;
		padding: 0.25rem 0.5rem 0.25rem 0;
		margin: 0;
		cursor: pointer;
		color: #555;
	}
	.search-close-inline {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: #888;
	}
	.search-close-inline:hover {
		color: #1a1a1a;
	}
	.search-icon-inset {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		align-self: stretch;
		padding: 0 0.35rem;
		margin: 0;
		background: none;
		border: none;
		cursor: pointer;
		color: #1a1a1a;
	}
	.search-icon-inset:hover {
		opacity: 0.75;
	}
	@media (min-width: 768px) {
		.search-bar--desktop {
			height: 42px;
			padding: 0 0.4rem 0 0.875rem;
		}
		.search-input {
			font-size: 0.9375rem;
		}
	}
	.search-input::placeholder {
		color: #a3a3a3;
	}
	.search-input:focus {
		outline: none;
	}
	.search-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		width: 100%;
		min-width: 0;
		margin-top: 0.25rem;
		max-height: 360px;
		overflow: auto;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		z-index: 200;
	}
	.search-status {
		color: #666;
		font-size: 0.9375rem;
		margin: 0;
		padding: 1rem 1.25rem;
	}
	.search-results {
		list-style: none;
		margin: 0;
		padding: 0.5rem 0;
	}
	.search-results li {
		margin: 0;
		padding: 0;
	}
	.result-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1.25rem;
		border: none;
		background: none;
		cursor: pointer;
		text-align: left;
		border-radius: 0;
		color: inherit;
		font: inherit;
	}
	.result-item:hover {
		background: #f5f5f5;
	}
	.result-image {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
		border-radius: 6px;
		overflow: hidden;
		background: #f5f0eb;
	}
	.result-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.result-details {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}
	.result-name {
		font-size: 0.9375rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.result-price {
		font-size: 0.8125rem;
		color: #666;
	}
</style>
