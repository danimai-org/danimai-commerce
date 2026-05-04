<script lang="ts">
    import { formatStoreMoney } from "$lib/money";

    let {
        subtotal,
        shipping = 0,
        discount = 0,
        taxDisplay,
        total,
        promoOpen,
        promoInput = $bindable(""),
        onOpenPromo,
        onApplyPromo,
        onClosePromo,
    }: {
        subtotal: number;
        shipping?: number;
        discount?: number;
        taxDisplay: string;
        total: number;
        promoOpen: boolean;
        promoInput: string;
        onOpenPromo: () => void;
        onApplyPromo: () => void;
        onClosePromo: () => void;
    } = $props();
</script>

<aside class="order-summary">
    <h2 class="order-summary-title">ORDER SUMMARY</h2>
    <dl class="order-summary-rows">
        <div class="summary-row">
            <dt>Subtotal</dt>
            <dd>{formatStoreMoney(subtotal)}</dd>
        </div>
        <div class="summary-row">
            <dt>Shipping</dt>
            <dd>{formatStoreMoney(shipping)}</dd>
        </div>
        <div class="summary-row">
            <dt>Discount</dt>
            <dd>{formatStoreMoney(discount)}</dd>
        </div>
        <div class="summary-row">
            <dt>Tax</dt>
            <dd>{taxDisplay}</dd>
        </div>
    </dl>
    <div class="summary-total">
        <span>Total</span>
        <strong>{formatStoreMoney(total)}</strong>
    </div>
    {#if !promoOpen}
        <button type="button" class="add-promo" onclick={onOpenPromo}
            >Add promo code</button
        >
    {:else}
        <div class="promo-row">
            <input
                type="text"
                class="promo-input"
                placeholder="Enter code"
                bind:value={promoInput}
                aria-label="Promo code"
            />
            <button type="button" class="promo-apply" onclick={onApplyPromo}
                >Apply</button
            >
            <button type="button" class="promo-cancel" onclick={onClosePromo}
                >Cancel</button
            >
        </div>
    {/if}
    <a href="/checkout" class="checkout-btn">PROCEED TO CHECKOUT</a>
    <p class="shipping-note">Free shipping on all orders</p>
</aside>
