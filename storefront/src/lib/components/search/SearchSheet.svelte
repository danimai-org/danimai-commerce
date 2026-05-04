<script lang="ts">
	import { goto } from '$app/navigation';
	import { API_BASE, firstVariantIdByProductIds, rowsFromPaginated } from '../../api/storefront-api';
	import { client } from '$lib/api/client.js';
	import { search } from '$lib/stores/search';
	import { formatStoreMoney } from '$lib/money';
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
			results = list.map((p, i) => {
				const raw = prices[i]?.amount;
				let price = '';
				if (raw != null && raw !== '') {
					const cents = parseInt(String(raw), 10);
					if (Number.isFinite(cents)) {
						price = formatStoreMoney(cents / 100);
					}
				}
				return {
					name: p.title,
					price,
					href: `/products/${p.handle}`,
					bg: '#f5f0eb',
					image: p.thumbnail || null
				};
			});
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
