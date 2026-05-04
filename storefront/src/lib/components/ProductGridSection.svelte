<script lang="ts">
    import ProductItem from "./productDetail/ProductItem.svelte";

    type ProductGridItem = {
        name: string;
        price: { amount: number; currency_code: string };
        href: string;
        bg: string;
        image: string | null;
        variantId?: string | null;
        variant_id?: string | null;
        variantTitle?: string | null;
        variants?: Array<{ id?: string | null; title?: string | null }>;
        variant?: { id?: string | null; title?: string | null } | null;
    };
    // export type ProductGridItem = Awaited<
    //   ReturnType<(typeof client)["storefront"]["products"]["get"]>
    // >["data"];

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
