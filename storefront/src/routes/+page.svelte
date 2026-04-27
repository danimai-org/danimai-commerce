<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import {
		HeroSection,
		ProductGridSection,
		StorySection,
		CollectionsSection,
		VideoSection,
		QuotesSection
	} from '$lib/components/sections';
	import type { ProductGridItem } from './store/+page.ts';
	import type { HomeCollectionCard } from './+page.ts';

	let { data } = $props();
	const products = $derived((data as { products?: ProductGridItem[] })?.products ?? []);
	const collections = $derived((data as { collections?: HomeCollectionCard[] })?.collections ?? []);
	const error = $derived((data as { error?: string })?.error ?? null);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="page-home">
	<SiteHeader />

	<main class="home-main">
		<HeroSection />

		{#if error}
			<p class="products-error">{error}</p>
		{/if}
		<ProductGridSection products={products} title="" subtitle="" />

		<StorySection />

		<CollectionsSection collections={collections} title=""  />

		<VideoSection />

		<QuotesSection />
	</main>

	<SiteFooter />
</div>

<style>
	.page-home {
		--font-serif: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
		--font-sans: 'DM Sans', system-ui, -apple-system, sans-serif;
	}

	:global(body) {
		margin: 0;
		font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
		color: #1a1a1a;
		background: #fff;
	}

	.home-main {
		display: block;
	}

	.products-error {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 1.5rem;
		color: #c00;
		text-align: center;
	}
</style>
