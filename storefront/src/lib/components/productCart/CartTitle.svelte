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
