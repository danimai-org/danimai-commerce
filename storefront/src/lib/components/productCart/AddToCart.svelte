<script lang="ts">
    type AddToCartVariant = "retail" | "feature";

    let {
        handleAddToCart,
        label = "Add to Cart",
        variant = "retail",
    }: {
        handleAddToCart: (e: MouseEvent) => void | Promise<void>;
        label?: string;
        variant?: AddToCartVariant;
    } = $props();

    async function handleClick(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        await handleAddToCart(e);
    }
</script>

<button
    type="button"
    class={`add-to-cart-btn ${variant}`}
    onclick={handleClick}
>
    {label}
</button>
