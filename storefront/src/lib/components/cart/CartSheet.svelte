<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        cartState,
        changeLineItemQuantity,
        closeCartSheet,
    } from "$lib/cart/cart-state.svelte";

    const cartItems = $derived(
        ((cartState.cart?.line_items ?? []) as any[]).map((item) => {
            const amount = Number.parseFloat(String(item.unit_price ?? "0"));
            const priceValue = Number.isFinite(amount) ? amount : 0;
            return {
                ...item,
                key:
                    item.id ??
                    `${item.variant_id ?? "variant"}-${item.title ?? "item"}`,
                name: item.title ?? "Item",
                variant:
                    item.description ?? (item.variant_id ? "Variant" : "—"),
                image: item.thumbnail ?? null,
                priceValue,
                priceDisplay: `$${priceValue.toFixed(2)}`,
            };
        }),
    );

    const subtotal = $derived(
        cartItems.reduce(
            (sum: number, i: any) => sum + i.priceValue * i.quantity,
            0,
        ),
    );
    const subtotalDisplay = $derived(`$${subtotal.toFixed(2)}`);

    function handleClose() {
        closeCartSheet();
    }

    function goToCart() {
        goto("/cart");
        closeCartSheet();
    }

    async function setQuantity(item: any, quantity: number) {
        await changeLineItemQuantity(item.id, quantity);
    }
</script>

{#if cartState.sheetOpen}
    <div
        class="backdrop"
        onclick={handleClose}
        onkeydown={(e) => (e.key === "Enter" || e.key === " ") && handleClose()}
        role="button"
        tabindex="-1"
        aria-label="Close cart"
    ></div>
    <div class="sheet" role="dialog" aria-label="Shopping Cart">
        <header class="sheet-header">
            <h2 class="sheet-title">Shopping Cart</h2>
            <button
                type="button"
                class="sheet-close"
                onclick={handleClose}
                aria-label="Close"
                >×</button
            >
        </header>

        <div class="sheet-body">
            {#if cartItems.length === 0}
                <p class="empty">Your cart is empty.</p>
            {:else}
                <ul class="line-items">
                    {#each cartItems as item (item.key)}
                        <li class="line-card">
                            <div class="line-card-media">
                                {#if item.image}
                                    <img src={item.image} alt="" />
                                {/if}
                            </div>
                            <div class="line-card-body">
                                <p class="line-card-title">{item.name}</p>
                                <p class="line-card-meta">{item.variant}</p>
                                <div class="line-controls-row">
                                    <div class="quantity-controls">
                                        <button
                                            type="button"
                                            class="qty-btn"
                                            onclick={() =>
                                                void setQuantity(
                                                    item,
                                                    item.quantity - 1,
                                                )}
                                            aria-label="Decrease quantity"
                                            >−</button
                                        >
                                        <span class="qty-value"
                                            >{item.quantity}</span
                                        >
                                        <button
                                            type="button"
                                            class="qty-btn"
                                            onclick={() =>
                                                void setQuantity(
                                                    item,
                                                    item.quantity + 1,
                                                )}
                                            aria-label="Increase quantity"
                                            >+</button
                                        >
                                    </div>
                                    <span class="line-card-price"
                                        >{item.priceDisplay}</span
                                    >
                                </div>
                            </div>
                            <button
                                type="button"
                                class="remove-btn"
                                onclick={() => void setQuantity(item, 0)}
                                aria-label="Remove item"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    ><path
                                        d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                    /><line
                                        x1="10"
                                        y1="11"
                                        x2="10"
                                        y2="17"
                                    /><line
                                        x1="14"
                                        y1="11"
                                        x2="14"
                                        y2="17"
                                    /></svg
                                >
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>

        {#if cartItems.length > 0}
            <footer class="sheet-footer">
                <div class="subtotal-row">
                    <span>Subtotal</span>
                    <strong>{subtotalDisplay}</strong>
                </div>
                <button type="button" class="go-to-cart" onclick={goToCart}
                    >Go to cart</button
                >
            </footer>
        {/if}
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.35);
        z-index: 1000;
    }
    .sheet {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 420px;
        background: #f7f7f7;
        box-shadow: -4px 0 28px rgba(0, 0, 0, 0.12);
        z-index: 1001;
        display: flex;
        flex-direction: column;
    }
    .sheet-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1rem;
        background: #fff;
        border-bottom: 1px solid #e4e4e4;
    }
    .sheet-title {
        font-size: 1.625rem;
        line-height: 1.1;
        font-weight: 600;
        margin: 0;
        color: #111;
    }
    .sheet-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        line-height: 1;
        cursor: pointer;
        color: #777;
        padding: 0.2rem;
    }
    .sheet-body {
        flex: 1;
        overflow: auto;
        padding: 0.85rem;
    }
    .empty {
        color: #777;
        text-align: center;
        padding: 2rem;
        margin: 0;
        font-size: 0.9375rem;
    }
    .line-items {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
    }
    .line-card {
        display: grid;
        grid-template-columns: 66px 1fr auto;
        gap: 0.6rem;
        border: 1px solid #ececec;
        background: #fff;
        padding: 0.45rem;
        align-items: start;
    }
    .line-card-media {
        width: 66px;
        height: 66px;
        background: #f2f2f2;
        overflow: hidden;
    }
    .line-card-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .line-card-body {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.18rem;
    }
    .line-card-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: #111;
        line-height: 1.25;
    }
    .line-card-meta {
        margin: 0;
        font-size: 0.78rem;
        color: #666;
    }
    .line-controls-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.25rem;
    }
    .line-card-price {
        font-size: 1.05rem;
        font-weight: 600;
        color: #333;
    }
    .quantity-controls {
        display: flex;
        align-items: center;
        gap: 0.52rem;
    }
    .qty-btn {
        width: 18px;
        height: 18px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.1rem;
        line-height: 1;
        color: #555;
        font-weight: 600;
        padding: 0;
    }
    .qty-value {
        min-width: 0.9rem;
        text-align: center;
        font-size: 0.85rem;
        font-weight: 500;
        color: #222;
    }
    .remove-btn {
        background: none;
        border: none;
        padding: 0.1rem;
        cursor: pointer;
        color: #666;
    }
    .sheet-footer {
        padding: 0.85rem 1rem 1rem;
        background: #fff;
        border-top: 1px solid #e4e4e4;
    }
    .subtotal-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        font-size: 2rem;
        line-height: 1;
        color: #1a1a1a;
        font-weight: 600;
    }
    .subtotal-row strong {
        font-weight: 700;
    }
    .go-to-cart {
        width: 100%;
        background: #44444f;
        color: #fff;
        border: none;
        padding: 0.7rem 1rem;
        font-size: 1.05rem;
        font-weight: 500;
        border-radius: 0;
        cursor: pointer;
    }
    .go-to-cart:hover {
        background: #3a3a44;
    }
</style>
