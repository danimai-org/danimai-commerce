<script lang="ts">
    import {
        AddToCart,
        CartImage,
        CartTitle,
    } from "$lib/components/productCart";

    let {
        href,
        title,
        priceDisplay,
        image,
        handleAddToCart,
    }: {
        href: string;
        title: string;
        priceDisplay: string;
        image: string | null;
        handleAddToCart: (e: MouseEvent) => void;
    } = $props();
</script>

<article class="complete-look-card">
    <a
        {href}
        class="complete-look-card-link"
        aria-label={`View ${title}`}
    >
        <CartImage {image} {title} variant="retail" bg="#f4f4f4" />
        <div class="complete-look-card-body">
            <CartTitle {title} {priceDisplay} variant="retail" />
        </div>
    </a>
    <AddToCart {handleAddToCart} label="Add to Cart" variant="retail" />
</article>
