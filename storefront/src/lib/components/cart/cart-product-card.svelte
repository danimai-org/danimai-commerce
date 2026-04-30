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
        onAddToCart,
    }: {
        href: string;
        title: string;
        priceDisplay: string;
        image: string | null;
        onAddToCart: (e: MouseEvent) => void;
    } = $props();
</script>

<a {href} class="product-card" aria-label={title}>
    <CartImage {image} {title} variant="feature" />
    <CartTitle {title} {priceDisplay} variant="feature" />
    <AddToCart {onAddToCart} label="Add to Cart" variant="feature" />
</a>

<style>
    .product-card {
        display: block;
        text-decoration: none;
        color: inherit;
        background: #e5e5e5;
        border: 1px solid #b9b9b9;
        border-radius: 14px;
        padding: 1rem 1rem 1.5rem;
    }
</style>
