<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { ProductGridSection } from '$lib/components/sections';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();
	const category = $derived(data?.category ?? null);
	const products = $derived(data?.products ?? []);
	const productCount = $derived(data?.productCount ?? 0);
	const error = $derived(data?.error ?? null);
	const currentSort = $derived(data?.sort ?? 'best-selling');
	const currentAvailability = $derived(data?.availability ?? 'all');
	const currentPrice = $derived(data?.price ?? 'all');
	const currentColor = $derived(data?.color ?? 'all');

	const categoryTitle = $derived(
		category
			? category.value.replace(/\b\w/g, (c) => c.toUpperCase())
			: ''
	);

	const sortOptions = [
		{ value: 'best-selling', label: 'Best selling' },
		{ value: 'newest', label: 'Newest' },
		{ value: 'title-asc', label: 'Title A–Z' },
		{ value: 'title-desc', label: 'Title Z–A' }
	];

	function updateUrl(updates: Record<string, string>) {
		const url = new URL($page.url.href);
		for (const [key, val] of Object.entries(updates)) {
			if (val === 'all' || !val) url.searchParams.delete(key);
			else url.searchParams.set(key, val);
		}
		goto(url.toString());
	}

	function applySort(e: Event) {
		updateUrl({ sort: (e.currentTarget as HTMLSelectElement).value });
	}
	function applyAvailability(e: Event) {
		updateUrl({ availability: (e.currentTarget as HTMLSelectElement).value });
	}
	function applyPrice(e: Event) {
		updateUrl({ price: (e.currentTarget as HTMLSelectElement).value });
	}
	function applyColor(e: Event) {
		updateUrl({ color: (e.currentTarget as HTMLSelectElement).value });
	}
</script>

<svelte:head>
	{#if categoryTitle}
		<title>{categoryTitle} – ESSENTIALS</title>
	{/if}
</svelte:head>

<SiteHeader />

{#if error && !category}
	<main class="category-main">
		<p class="category-error">{error}</p>
	</main>
{:else if category}
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
		{#if error}
			<p class="category-error">{error}</p>
		{/if}
		<ProductGridSection
			products={products}
			title=""
			subtitle=""
		/>
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
