<script lang="ts">
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import ProductGridSection from "$lib/components/ProductGridSection.svelte";
    import CatalogToolbar from "$lib/components/CatalogToolbar.svelte";

    let { data } = $props();
    const products = $derived(data?.products ?? []);

    const error = $derived(data?.error ?? null);

    const total = $derived(products.length);
</script>

<SiteHeader />

<main class="store-main">
    <section class="store-hero">
        <h1 class="store-hero-title">Shop All</h1>
    </section>
    {#if error}
        <p class="store-error">{error}</p>
    {/if}
    <CatalogToolbar />
    <ProductGridSection {products} title="" subtitle="" />
</main>

<SiteFooter />
