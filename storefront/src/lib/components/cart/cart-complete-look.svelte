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
                handleAddToCart={(e) =>
                    onQuickAdd(e, {
                        id: product.id,
                        title: product.title,
                        handle: product.handle,
                    })}
            />
        {/each}
    </div>
</section>
