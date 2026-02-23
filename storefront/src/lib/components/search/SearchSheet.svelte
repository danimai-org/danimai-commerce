<script lang="ts">
	import { goto } from '$app/navigation';
	import { search } from '$lib/stores/search';

	const API_BASE =
		(typeof import.meta.env !== 'undefined' && (import.meta.env?.VITE_API_BASE as string)) ||
		'http://localhost:8000';

	type SearchProduct = {
		name: string;
		price: string;
		href: string;
		image: string | null;
	};

	let searchState = $state({ open: false });
	let query = $state('');
	let results = $state<SearchProduct[]>([]);
	let loading = $state(false);
	let inputEl = $state<HTMLInputElement | undefined>(undefined);

	$effect(() => {
		const unsub = search.subscribe((s) => {
			searchState = { open: s.open };
		});
		return unsub;
	});

	$effect(() => {
		if (!searchState.open) return;
		query = '';
		results = [];
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') search.close();
		};
		document.addEventListener('keydown', onKey);
		requestAnimationFrame(() => inputEl?.focus());
		return () => document.removeEventListener('keydown', onKey);
	});

	let debounceId = 0;
	$effect(() => {
		const q = query.trim();
		clearTimeout(debounceId);
		if (!searchState.open) return;
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
			const params = new URLSearchParams({
				search: q,
				limit: '20',
				page: '1'
			});
			const res = await fetch(`${API_BASE}/products?${params}`, { cache: 'no-store' });
			if (!res.ok) {
				results = [];
				return;
			}
			const data = (await res.json()) as {
				products?: Array<{
					id: string;
					title: string;
					handle: string;
					thumbnail: string | null;
					variants?: Array<{ id: string }>;
				}>;
			};
			const list = data.products ?? [];
			const variantIds = list
				.map((p) => p.variants?.[0]?.id)
				.filter((id): id is string => !!id);
			type PriceObj = { amount: string; currency_code: string } | null;
			const prices: PriceObj[] = await Promise.all(
				variantIds.map((id) =>
					fetch(`${API_BASE}/product-variants/${id}`, { cache: 'no-store' })
						.then((r) => r.json())
						.then(
							(d: { prices?: Array<{ amount: string; currency_code: string }> }) =>
								d.prices?.[0] ?? null
						)
						.catch(() => null)
				)
			);
			let pi = 0;
			results = list.map((p) => {
				const pr: PriceObj = variantIds[pi] ? prices[pi] ?? null : null;
				pi++;
				const amount = pr ? parseInt(pr.amount, 10) / 100 : 0;
				const priceStr =
					pr && pr.currency_code === 'USD'
						? `$${amount.toFixed(2)}`
						: pr
							? `${pr.currency_code} ${amount.toFixed(2)}`
							: '—';
				return {
					name: p.title,
					price: priceStr,
					href: `/products/${p.handle}`,
					image: p.thumbnail ?? null
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
		search.close();
		goto(href);
	}
</script>

{#if searchState.open}
	<div class="search-bar-wrap">
		<div class="search-bar">
			<span class="search-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
			</span>
			<input
				bind:this={inputEl}
				type="search"
				class="search-input"
				placeholder="Search for products..."
				aria-label="Search for products"
				bind:value={query}
				autocomplete="off"
			/>
			<button
				type="button"
				class="search-clear"
				aria-label="Clear search"
				onclick={clearInput}
				tabindex="-1"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
			</button>
			<button type="button" class="search-close-btn" aria-label="Close search" onclick={handleClose}>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
			</button>
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
		width: 300px;
		flex-shrink: 0;
	}
	.search-bar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 300px;
		height: 48px;
		padding: 0 0.75rem 0 1rem;
		background: #fff;
		border: 1px solid #1a1a1a;
		border-radius: 4px;
		box-sizing: border-box;
	}
	.search-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #888;
		flex-shrink: 0;
	}
	.search-input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		font-size: 1rem;
		color: #1a1a1a;
		padding: 0;
	}
	.search-input::placeholder {
		color: #999;
	}
	.search-input:focus {
		outline: none;
	}
	.search-clear {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: #888;
		flex-shrink: 0;
	}
	.search-clear:hover {
		color: #1a1a1a;
	}
	.search-close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: #888;
		flex-shrink: 0;
	}
	.search-close-btn:hover {
		color: #1a1a1a;
	}
	.search-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: auto;
		width: 300px;
		min-width: 300px;
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
