<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        cartState,
        changeLineItemQuantity,
        closeCartSheet,
        removeLineItem,
    } from "$lib/cart/cart-state.svelte";
    import {
        fetchVariantDisplayMap,
        variantDisplayLabel,
        type VariantDisplayRow,
    } from "$lib/cart/variant-display-map";
    import { formatStoreMoney } from "$lib/money";

    let variantDisplayById = $state(new Map<string, VariantDisplayRow>());

    $effect(() => {
        const lineItems = cartState.cart?.line_items;
        if (!lineItems?.length) {
            variantDisplayById = new Map();
            return;
        }
        let cancelled = false;
        void (async () => {
            const next = await fetchVariantDisplayMap(lineItems);
            if (!cancelled) variantDisplayById = next;
        })();
        return () => {
            cancelled = true;
        };
    });

    const cartItems = $derived(
        ((cartState.cart?.line_items ?? []) as any[]).map((item) => {
            const amount = Number.parseFloat(String(item.unit_price ?? "0"));
            const priceValue = Number.isFinite(amount) ? amount : 0;
            const fromMap = item.variant_id
                ? variantDisplayById.get(item.variant_id)
                : undefined;
            const desc =
                typeof item.description === "string"
                    ? item.description.trim()
                    : "";
            const variant =
                desc ||
                variantDisplayLabel(fromMap) ||
                (item.variant_id ? "" : "—");
            return {
                ...item,
                key:
                    item.id ??
                    `${item.variant_id ?? "variant"}-${item.title ?? "item"}`,
                name: item.title ?? "Item",
                variant,
                image: item.thumbnail ?? fromMap?.thumbnail ?? null,
                priceValue,
                priceDisplay: formatStoreMoney(priceValue),
            };
        }),
    );

    const subtotal = $derived(
        cartItems.reduce(
            (sum: number, i: any) => sum + i.priceValue * i.quantity,
            0,
        ),
    );
    const subtotalDisplay = $derived(formatStoreMoney(subtotal));

    function handleClose() {
        closeCartSheet();
    }

    function goToCart() {
        goto("/cart");
        closeCartSheet();
    }

    async function increaseQuantity(item: any) {
        const current = Math.max(1, item.quantity ?? 1);
        await changeLineItemQuantity(item.id, current + 1, item.variant_id);
    }

    async function decreaseQuantity(item: any) {
        const current = Math.max(1, item.quantity ?? 1);
        if (current <= 1) return;
        await changeLineItemQuantity(item.id, current - 1, item.variant_id);
    }

    async function removeItem(item: any) {
        if (!confirm("Remove this item from your cart?")) return;
        await removeLineItem(item.id);
    }
</script>

{#if cartState.sheetOpen}
    <div class="cart-sheet-root">
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
                aria-label="Close">×</button
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
                                {#if item.variant}
                                    <p class="line-card-meta">{item.variant}</p>
                                {/if}
                                <div class="line-controls-row">
                                    <div class="quantity-controls">
                                        <button
                                            type="button"
                                            class="qty-btn"
                                            disabled={(item.quantity ?? 1) <= 1}
                                            onclick={() => void decreaseQuantity(item)}
                                            aria-label="Decrease quantity"
                                            >−</button
                                        >
                                        <span class="qty-value"
                                            >{item.quantity}</span
                                        >
                                        <button
                                            type="button"
                                            class="qty-btn"
                                            onclick={() => void increaseQuantity(item)}
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
                                onclick={() => void removeItem(item)}
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
    </div>
{/if}
