<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { HeroSection, ProductGridSection, StorySection, CollectionsSection, QuotesSection } from '$lib/components/sections';

	let { data } = $props();
	const products = $derived(data?.products ?? []);
	const error = $derived(data?.error ?? null);
</script>

<SiteHeader />

<HeroSection />

{#if error}
	<p class="products-error">{error}</p>
{/if}
<ProductGridSection {products} />

<StorySection />

<CollectionsSection />

<QuotesSection />

<SiteFooter />

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
		color: #1a1a1a;
	}

	/* Banner strip */
	.banner-strip {
		position: relative;
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.banner-strip-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #6b7c5c 0%, #8a9a7a 100%);
	}

	.banner-strip-bg-alt {
		background: linear-gradient(135deg, #c4b8a8 0%, #e0d5c8 100%);
	}

	.banner-strip-text {
		position: relative;
		z-index: 1;
		font-size: 0.8125rem;
		color: #fff;
		background: rgba(0,0,0,0.25);
		padding: 0.5rem 1rem;
	}

	.products-error {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1.5rem;
		color: #c00;
		text-align: center;
	}
</style>
