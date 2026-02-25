<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { ProductGridSection } from '$lib/components/sections';

	let { data } = $props();
	const products = $derived(data?.products ?? []);
	const error = $derived(data?.error ?? null);
</script>

<SiteHeader />

<main class="store-main">
	<section class="store-hero">
		<h1 class="store-hero-title">Shop All</h1>
	</section>
	{#if error}
		<p class="store-error">{error}</p>
	{/if}
	<ProductGridSection
		products={products}
		title=""
		subtitle=""
	/>
</main>

<SiteFooter />

<style>
	.store-main {
		min-height: 40vh;
	}
	.store-hero {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		background: linear-gradient(180deg, #e8e0d5 0%, #d4c8bc 100%);
		padding: 3rem 1.5rem;
	}
	.store-hero-title {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		color: #fff;
		text-align: center;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
	.store-error {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1.5rem;
		color: #c00;
		text-align: center;
	}
</style>
