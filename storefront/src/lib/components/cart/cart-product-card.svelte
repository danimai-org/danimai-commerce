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

<style>
    .complete-look-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #fff;
        border: 1px solid #e6e6e6;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        transition:
            box-shadow 0.2s ease,
            border-color 0.2s ease;
    }
    .complete-look-card:hover {
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.07);
        border-color: #d4d4d4;
    }
    .complete-look-card-link {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        text-decoration: none;
        color: inherit;
    }
    .complete-look-card-body {
        padding: 0.75rem 1rem 0.35rem;
        flex: 1;
    }
</style>
