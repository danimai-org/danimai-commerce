<script lang="ts">
    import ProductItem from "../productDetail/ProductItem.svelte";

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

<style>
    .section {
        max-width: var(--section-max-width, 1200px);
        margin: 0 auto;
        padding: var(--section-padding-y, 4rem) var(--section-padding-x, 1.5rem);
        box-sizing: border-box;
    }
    .section-title {
        font-family: var(--font-serif, Georgia, serif);
        font-size: clamp(1.5rem, 3vw, 2.125rem);
        font-weight: 600;
        text-align: center;
        margin: 0 0 0.5rem;
        letter-spacing: -0.02em;
    }
    .section-subtitle {
        text-align: center;
        margin: 0 0 2.5rem;
        color: #555;
        font-size: 0.9375rem;
        line-height: 1.55;
        max-width: 36rem;
        margin-left: auto;
        margin-right: auto;
    }
    .product-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: clamp(1rem, 2vw, 1.75rem);
    }

    @media (max-width: 1024px) {
        .product-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (max-width: 640px) {
        .product-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
