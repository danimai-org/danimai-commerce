<script lang="ts">
    import ProductItem from "./productDetail/ProductItem.svelte";
    import type { ProductGridItem } from "$lib/types/product-grid";

    let {
        products = [] as ProductGridItem[] | undefined,
        title = "Essential essentials for everyday.",
        subtitle = "A collection of versatile pieces for your daily movement.",
    }: {
        products?: ProductGridItem[] | undefined;
        title?: string;
        subtitle?: string;
    } = $props();
</script>

<section class="section products-section">
    {#if title}
        <h2 class="section-title">{title}</h2>
    {/if}
    {#if subtitle}
        <p class="section-subtitle">{subtitle}</p>
    {/if}
    <div class="product-grid">
        {#each products as product}
            <ProductItem {product} />
        {/each}
    </div>
</section>
