<script lang="ts">
    import { SiteHeader, SiteFooter } from "$lib/components/layout";

    import type { HomeCollectionCard, HomeProductGridItem } from "./+page.ts";
    import CartLineItems from "$lib/components/cart/cart-line-items.svelte";
    import HeroSection from "$lib/components/home/HeroSection.svelte";
    import ProductGridSection from "$lib/components/ProductGridSection.svelte";
    import StorySection from "$lib/components/home/StorySection.svelte";
    import CollectionsSection from "$lib/components/home/CollectionsSection.svelte";
    import VideoSection from "$lib/components/home/VideoSection.svelte";
    import QuotesSection from "$lib/components/home/QuotesSection.svelte";

    let { data } = $props();
    const products = $derived(
        (data as { products?: HomeProductGridItem[] })?.products ?? [],
    );
    const collections = $derived(
        (data as { collections?: HomeCollectionCard[] })?.collections ?? [],
    );
    const error = $derived((data as { error?: string })?.error ?? null);
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
    />
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
        <ProductGridSection {products} title="" subtitle="" />

        <StorySection />

        <CollectionsSection {collections} title="" />

        <VideoSection />

        <QuotesSection />
    </main>

    <SiteFooter />
</div>
