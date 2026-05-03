<script lang="ts">
    import CartProductCard from "./cart-product-card.svelte";

    type ProductItem = {
        id: string;
        title: string;
        handle: string;
        thumbnail?: string | null;
    };
    type LookExtra = { image: string | null; priceDisplay: string };

    let {
        products,
        lookExtrasByProductId,
        onQuickAdd,
    }: {
        products: ProductItem[];
        lookExtrasByProductId: Map<string, LookExtra>;
        onQuickAdd: (
            e: MouseEvent,
            product: { id: string; title: string; handle: string },
        ) => void;
    } = $props();
</script>

<section class="complete-look" aria-labelledby="complete-look-heading">
    <header class="complete-look-header">
        <h2 id="complete-look-heading" class="complete-look-title">
            Complete Your Look
        </h2>
        <p class="complete-look-subtitle">
            Pieces chosen to pair with what's in your bag
        </p>
    </header>
    <div class="complete-look-grid">
        {#each products.slice(0, 4) as product}
            {@const extra = lookExtrasByProductId.get(product.id)}
            {@const imgUrl = extra?.image ?? product.thumbnail ?? null}
            <CartProductCard
                href={`/products/${product.handle}`}
                title={product.title}
                priceDisplay={extra?.priceDisplay ?? "—"}
                image={imgUrl}
                onAddToCart={(e) =>
                    onQuickAdd(e, {
                        id: product.id,
                        title: product.title,
                        handle: product.handle,
                    })}
            />
        {/each}
    </div>
</section>

<style>
    .complete-look {
        max-width: 1200px;
        margin: 0 auto;
        padding: 3.5rem 1.5rem 2.5rem;
        border-top: 1px solid #ebebeb;
        background: linear-gradient(180deg, #fafafa 0%, #fff 48%);
    }
    .complete-look-header {
        text-align: center;
        margin-bottom: 2rem;
    }
    .complete-look-title {
        font-family: var(--font-serif, Georgia, serif);
        font-size: clamp(1.65rem, 3.2vw, 2.125rem);
        font-weight: 600;
        margin: 0 0 0.45rem;
        color: #141414;
        letter-spacing: -0.02em;
        line-height: 1.15;
    }
    .complete-look-subtitle {
        margin: 0;
        font-size: 0.9375rem;
        color: #5c5c5c;
        line-height: 1.5;
        max-width: 26rem;
        margin-inline: auto;
    }
    .complete-look-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: clamp(1rem, 2vw, 1.35rem);
        align-items: stretch;
    }
    @media (max-width: 1024px) {
        .complete-look-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (max-width: 640px) {
        .complete-look-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
