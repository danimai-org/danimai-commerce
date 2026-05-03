<script lang="ts">
    type CartTitleVariant = "retail" | "feature";

    let {
        title,
        priceDisplay,
        variant = "retail",
    }: {
        title: string;
        priceDisplay: string;
        variant?: CartTitleVariant;
    } = $props();
</script>

{#if variant === "feature"}
    <h3 class="product-title feature">{title}</h3>
    <p class="product-price feature">Price&nbsp;&nbsp;{priceDisplay}</p>
{:else}
    <h3 class="product-title retail">{title}</h3>
    <p class="product-price retail">
        <span class="price-label">Price - </span>
        <span class="price-value">{priceDisplay}</span>
    </p>
{/if}

<style>
    .product-title {
        color: #1a1a1a;
    }
    .product-title.retail {
        font-size: 0.875rem;
        font-weight: 600;
        line-height: 1.35;
        margin: 0;
        text-align: left;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        overflow: hidden;
    }
    .product-price.retail {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: 700;
        color: #1a1a1a;
    }
    .price-label {
        font-weight: 700;
        margin-right: 0.35rem;
    }
    .price-value {
        font-weight: 700;
    }
    .product-title.feature {
        font-size: 2rem;
        font-weight: 700;
        margin: 1.25rem 0 0.75rem;
        line-height: 1.15;
    }
    .product-price.feature {
        font-size: 2.25rem;
        font-weight: 700;
        margin: 0 0 1.5rem;
        color: #1a1a1a;
    }
    @media (max-width: 900px) {
        .product-title.feature {
            font-size: 1.25rem;
        }
        .product-price.feature {
            font-size: 1.75rem;
        }
    }
</style>
