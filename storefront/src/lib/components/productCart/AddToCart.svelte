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

<style>
    .add-to-cart-btn {
        width: 100%;
        border: none;
        color: #fff;
        cursor: pointer;
    }
    .add-to-cart-btn.retail {
        box-sizing: border-box;
        margin-top: auto;
        margin-inline: 0.75rem;
        margin-bottom: 0.75rem;
        padding: 0.6875rem 1.75rem;
        width: calc(100% - 1.5rem);
        align-self: center;
        border-radius: 8px;
        background: #808050;
        font-size: 0.9375rem;
        font-weight: 600;
    }
    .add-to-cart-btn.retail:hover {
        background: #6d6d45;
    }
    .add-to-cart-btn.feature {
        border-radius: 16px;
        background: #858555;
        padding: 1.2rem 1rem;
        font-size: 2.1rem;
        font-weight: 700;
    }
    .add-to-cart-btn.feature:hover {
        background: #76764c;
    }
    @media (max-width: 900px) {
        .add-to-cart-btn.feature {
            font-size: 1.35rem;
            padding: 0.95rem 1rem;
        }
    }
</style>
