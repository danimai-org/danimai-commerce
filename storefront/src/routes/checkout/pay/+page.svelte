<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import { StripePaymentCheckout } from "$lib/components/checkout";
    import {
        clearPendingStripePayment,
        loadPendingStripePayment,
        savePendingStripePayment,
        startStripePaymentElement,
        type StripePaymentElementSession,
    } from "$lib/checkout/payment-api";
    import { cartState, initCartState } from "$lib/cart/cart-state.svelte";

    const CART_STORAGE_KEY = "dm_sf_cart_id";

    let session = $state<StripePaymentElementSession | null>(null);
    let pageError = $state("");
    let isInitializing = $state(true);
    let initRequestId = 0;

    const orderId = $derived(page.url.searchParams.get("order")?.trim() ?? "");
    const paymentIdParam = $derived(
        page.url.searchParams.get("payment")?.trim() ?? "",
    );

    const returnUrl = $derived(
        browser && orderId
            ? `${window.location.origin}/order/confirmation?order=${orderId}`
            : "",
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

    async function handlePaymentSuccess() {
        if (!orderId) return;
        clearPendingStripePayment(orderId);
        await clearCartAfterPayment();
        await goto(`/order/confirmation?order=${orderId}`);
    }

    $effect(() => {
        if (!browser) return;

        const refOrderId = orderId;
        const refPaymentIdParam = paymentIdParam;
        if (!refOrderId) {
            pageError = "Missing order id.";
            isInitializing = false;
            return;
        }

        const pending = loadPendingStripePayment(refOrderId);
        const paymentId = refPaymentIdParam || pending?.paymentId;
        if (!paymentId) {
            pageError = "Payment session not found. Please return to checkout.";
            isInitializing = false;
            return;
        }

        let cancelled = false;
        const requestId = ++initRequestId;
        isInitializing = true;
        pageError = "";

        void (async () => {
            try {
                const stripeSession = await startStripePaymentElement(paymentId);

                savePendingStripePayment(
                    refOrderId,
                    paymentId,
                    stripeSession.transactionId,
                );

                if (cancelled || requestId !== initRequestId) return;
                session = stripeSession;
            } catch (error) {
                if (!cancelled && requestId === initRequestId) {
                    pageError =
                        error instanceof Error
                            ? error.message
                            : "Unable to start payment.";
                }
            } finally {
                if (!cancelled && requestId === initRequestId) {
                    isInitializing = false;
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    });
</script>

<SiteHeader />

<div class="stripe-pay-page">
    <main class="stripe-pay-main">
        <div class="stripe-pay-card">
            <h1 class="stripe-pay-title">Complete your payment</h1>
            <p class="stripe-pay-subtitle">
                Choose a payment method below. Your card will be charged when you
                confirm.
            </p>

            {#if isInitializing}
                <div class="stripe-pay-loading" role="status">
                    <div class="stripe-pay-spinner" aria-hidden="true"></div>
                    <p>Preparing checkout…</p>
                </div>
            {:else if pageError}
                <p class="stripe-pay-error" role="alert">{pageError}</p>
                <a href="/checkout?payment" class="stripe-pay-cancel"
                    >Return to checkout</a
                >
            {:else if session && returnUrl}
                {#key session.transactionId}
                    <StripePaymentCheckout
                        publishableKey={session.publishableKey}
                        {session}
                        {returnUrl}
                        onSuccess={handlePaymentSuccess}
                    />
                {/key}
                <a href="/checkout?payment" class="stripe-pay-cancel"
                    >Cancel and return to checkout</a
                >
            {/if}
        </div>
    </main>
</div>

<SiteFooter />
