<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import {
        fetchOrderDetailFromApi,
        resolveOrderDetail,
        type OrderDetail,
    } from "$lib/account/order-data";
    import {
        clearPendingStripePayment,
        confirmStripePayment,
        confirmStripePaymentIntent,
        loadPendingStripePayment,
    } from "$lib/checkout/payment-api";
    import { cartState, initCartState } from "$lib/cart/cart-state.svelte";

    const CART_STORAGE_KEY = "dm_sf_cart_id";

    let order = $state<OrderDetail | null>(null);
    let isLoading = $state(true);
    let confirmingPayment = $state(false);
    let errorMessage = $state("");
    let paymentConfirmError = $state("");

    const orderId = $derived(page.url.searchParams.get("order")?.trim() ?? "");
    const stripeSessionId = $derived(
        page.url.searchParams.get("session_id")?.trim() ?? "",
    );
    const stripePaymentIntentId = $derived(
        page.url.searchParams.get("payment_intent")?.trim() ?? "",
    );

    async function clearCartAfterPayment() {
        localStorage.removeItem(CART_STORAGE_KEY);
        cartState.cart = null;
        cartState.initialized = false;
        cartState.loading = false;
        cartState.error = null;
        cartState.sheetOpen = false;
        await initCartState(true);
    }

    $effect(() => {
        if (!browser) return;

        const ref = orderId;
        if (!ref) {
            order = null;
            errorMessage = "Missing order id in URL.";
            isLoading = false;
            return;
        }

        let cancelled = false;
        isLoading = true;
        errorMessage = "";
        paymentConfirmError = "";

        void (async () => {
            const pending = loadPendingStripePayment(ref);
            const sessionId = stripeSessionId;
            const paymentIntentId = stripePaymentIntentId;
            const transactionId = pending?.transactionId;

            if (transactionId && (sessionId || paymentIntentId)) {
                confirmingPayment = true;
                try {
                    if (sessionId) {
                        await confirmStripePayment(transactionId, sessionId);
                    } else if (paymentIntentId) {
                        await confirmStripePaymentIntent(
                            transactionId,
                            paymentIntentId,
                        );
                    }
                    clearPendingStripePayment(ref);
                    await clearCartAfterPayment();
                } catch (error) {
                    paymentConfirmError =
                        error instanceof Error
                            ? error.message
                            : "Payment confirmation failed.";
                } finally {
                    if (!cancelled) confirmingPayment = false;
                }
            }

            const needsApiFetch =
                (sessionId || paymentIntentId) && transactionId;
            const detail = needsApiFetch
                ? ((await fetchOrderDetailFromApi(ref)) ??
                  (await resolveOrderDetail(ref)))
                : await resolveOrderDetail(ref);
            if (cancelled) return;

            if (!detail) {
                order = null;
                errorMessage = "Unable to display this order right now.";
            } else {
                order = detail;
                errorMessage = "";
            }
            isLoading = false;
        })();

        return () => {
            cancelled = true;
        };
    });
</script>

<SiteHeader />

<main class="order-confirmation-page">
    <div class="confirmation-container">
        {#if isLoading || confirmingPayment}
            <section class="order-overview">
                <h1>Thank you for your order</h1>
                <p class="order-number">
                    {confirmingPayment
                        ? "Confirming payment..."
                        : "Loading order..."}
                </p>
            </section>
        {:else if errorMessage || !order}
            <section class="order-overview">
                <h1>Thank you for your order</h1>
                <p class="order-number">
                    {errorMessage || "Unable to display this order right now."}
                </p>
            </section>
        {:else}
            <section class="order-overview">
                <h1>Thank you for your order</h1>
                <p class="order-number">Order #{order.number}</p>
                {#if paymentConfirmError}
                    <p class="payment-confirm-error">{paymentConfirmError}</p>
                {/if}

                <div class="order-details">
                    <h2>Order Details</h2>
                    <p><span>Order ID:</span> {order.id}</p>
                    <p>
                        <span>Order Date:</span>
                        {order.date.toLocaleDateString()}
                    </p>
                    <p><span>Order Status:</span> {order.status}</p>
                    <p><span>Order Email:</span> {order.email}</p>
                </div>
            </section>

            <section class="order-section">
                <h3>Items</h3>
                {#if order.items.length === 0}
                    <p class="empty-state">
                        Item details are not available for this order yet.
                    </p>
                {:else}
                    <div class="items-list">
                        {#each order.items as item}
                            <article class="item-row">
                                <div class="item-main">
                                    <img
                                        src={item.image}
                                        alt={item.imageAlt}
                                        loading="lazy"
                                    />
                                    <div class="item-copy">
                                        <p class="item-title">{item.title}</p>
                                        <p class="item-variant">
                                            {item.variant}
                                        </p>
                                        <p class="item-qty">
                                            Quantity: {item.quantity}
                                        </p>
                                    </div>
                                </div>
                                <p class="item-price">{item.price}</p>
                            </article>
                        {/each}
                    </div>
                {/if}
            </section>

            <section class="order-section info-grid">
                <div class="info-block">
                    <h3>Delivery Information</h3>
                    <div class="info-cols">
                        <div>
                            <h4>Shipping Address</h4>
                            {#if order.shippingAddress.length === 0}
                                <p>—</p>
                            {:else}
                                {#each order.shippingAddress as line}
                                    <p>{line}</p>
                                {/each}
                            {/if}
                        </div>
                        <div>
                            <h4>Shipping Method</h4>
                            <p>{order.shippingMethod}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="order-section info-grid">
                <div class="info-cols">
                    <div>
                        <h3>Billing Information</h3>
                        <h4>Billing Address</h4>
                        {#if order.billingAddress.length === 0}
                            <p>—</p>
                        {:else}
                            {#each order.billingAddress as line}
                                <p>{line}</p>
                            {/each}
                        {/if}
                    </div>
                    <div>
                        <h3>Payment Method</h3>
                        <h4>Payment Method</h4>
                        <p>{order.paymentMethod}</p>
                    </div>
                </div>
            </section>

            <section class="order-section summary-block">
                <h3>Summary</h3>
                <div class="summary-rows">
                    <p>
                        <span>Subtotal</span><strong
                            >{order.totals.subtotal}</strong
                        >
                    </p>
                    <p>
                        <span>Shipping</span><strong
                            >{order.totals.shipping}</strong
                        >
                    </p>
                    <p>
                        <span>Discount</span><strong
                            >{order.totals.discount}</strong
                        >
                    </p>
                    <p><span>Tax</span><strong>{order.totals.tax}</strong></p>
                    <p class="summary-total">
                        <span>Total</span><strong>{order.totals.total}</strong>
                    </p>
                </div>
            </section>
        {/if}
    </div>
</main>

<SiteFooter />
