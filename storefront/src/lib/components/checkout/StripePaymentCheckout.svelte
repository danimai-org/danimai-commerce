<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import {
        loadStripe,
        type Stripe,
        type StripeElements,
        type StripePaymentElement,
    } from "@stripe/stripe-js";
    import { formatMoney } from "$lib/money";
    import {
        confirmStripePaymentIntent,
        type StripePaymentElementSession,
    } from "$lib/checkout/payment-api";

    type CheckoutStatus =
        | "loading"
        | "ready"
        | "processing"
        | "error"
        | "success";

    interface Props {
        publishableKey: string;
        session: StripePaymentElementSession;
        returnUrl: string;
        onSuccess?: () => void;
    }

    let { publishableKey, session, returnUrl, onSuccess }: Props = $props();

    let status = $state<CheckoutStatus>("loading");
    let errorMessage = $state("");
    let successMessage = $state("");
    let paymentElementMount = $state<HTMLDivElement | null>(null);

    let stripe = $state<Stripe | null>(null);
    let elements = $state<StripeElements | null>(null);
    let paymentElement = $state<StripePaymentElement | null>(null);

    const payLabel = $derived(
        formatMoney(
            Number.parseFloat(session.amount) || 0,
            session.currencyCode,
        ),
    );

    function teardownStripe() {
        paymentElement?.unmount();
        paymentElement = null;
        elements = null;
        stripe = null;
    }

    function waitForPaymentElementReady(
        el: StripePaymentElement,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const onReady = () => {
                el.off("ready", onReady);
                el.off("loaderror", onLoadError);
                resolve();
            };
            const onLoadError = (event: { error: { message?: string } }) => {
                el.off("ready", onReady);
                el.off("loaderror", onLoadError);
                reject(
                    new Error(
                        event.error.message ??
                            "Failed to load payment methods.",
                    ),
                );
            };
            el.on("ready", onReady);
            el.on("loaderror", onLoadError);
        });
    }

    onMount(() => {
        const mountEl = paymentElementMount;
        const pk = publishableKey;
        const clientSecret = session.paymentIntentClientSecret;
        if (!mountEl || !pk || !clientSecret) {
            status = "error";
            errorMessage = "Payment form could not be initialized.";
            return;
        }

        let destroyed = false;
        status = "loading";
        errorMessage = "";

        void (async () => {
            try {
                const stripeInstance = await loadStripe(pk);
                if (destroyed) return;
                if (!stripeInstance) {
                    throw new Error("Failed to load Stripe.");
                }

                const elementsInstance = stripeInstance.elements({
                    clientSecret,
                    appearance: {
                        theme: "stripe",
                        variables: {
                            colorPrimary: "#2563eb",
                            borderRadius: "8px",
                            fontFamily:
                                'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                        },
                    },
                });

                const el = elementsInstance.create(
                    "payment",
                ) as StripePaymentElement;
                if (destroyed) return;

                const readyPromise = waitForPaymentElementReady(el);
                el.mount(mountEl);
                await readyPromise;

                if (destroyed) {
                    el.unmount();
                    return;
                }

                stripe = stripeInstance;
                elements = elementsInstance;
                paymentElement = el;
                status = "ready";
            } catch (err) {
                if (!destroyed) {
                    status = "error";
                    errorMessage =
                        err instanceof Error
                            ? err.message
                            : "Failed to initialize payment form.";
                }
            }
        })();

        return () => {
            destroyed = true;
            teardownStripe();
        };
    });

    onDestroy(() => {
        teardownStripe();
    });

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        if (
            !stripe ||
            !elements ||
            !paymentElement ||
            status !== "ready"
        ) {
            return;
        }

        status = "processing";
        errorMessage = "";

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                errorMessage =
                    submitError.message ??
                    "Please check your payment details.";
                return;
            }

            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: { return_url: returnUrl },
                redirect: "if_required",
            });

            if (error) {
                errorMessage =
                    error.message ?? "Payment failed. Please try again.";
                return;
            }

            if (paymentIntent?.status === "succeeded") {
                try {
                    await confirmStripePaymentIntent(
                        session.transactionId,
                        paymentIntent.id,
                    );
                    status = "success";
                    successMessage = "Payment successful. Redirecting…";
                    onSuccess?.();
                } catch (err) {
                    status = "error";
                    errorMessage =
                        err instanceof Error
                            ? err.message
                            : "Payment succeeded but confirmation failed.";
                }
                return;
            }

            if (
                paymentIntent?.status === "processing" ||
                paymentIntent?.status === "requires_capture"
            ) {
                errorMessage =
                    "Your payment is still processing. Please wait a moment and try again.";
                return;
            }

            errorMessage =
                "Payment could not be completed. Please try again.";
        } catch (err) {
            errorMessage =
                err instanceof Error
                    ? err.message
                    : "Payment failed. Please try again.";
        } finally {
            if (status === "processing") {
                status = "ready";
            }
        }
    }
</script>

<form onsubmit={handleSubmit}>
    {#if errorMessage}
        <p class="stripe-pay-error" role="alert">{errorMessage}</p>
    {/if}
    {#if successMessage}
        <p class="stripe-pay-success" role="status">{successMessage}</p>
    {/if}

    <div class="stripe-pay-element-wrap">
        <div
            class="stripe-pay-element"
            bind:this={paymentElementMount}
            aria-label="Payment details"
        ></div>
        {#if status === "loading"}
            <div
                class="stripe-pay-loading-overlay"
                role="status"
                aria-live="polite"
            >
                <div class="stripe-pay-spinner" aria-hidden="true"></div>
                <p>Loading payment methods…</p>
            </div>
        {/if}
    </div>

    <button
        type="submit"
        class="stripe-pay-submit"
        disabled={status !== "ready"}
    >
        {status === "processing"
            ? "Processing…"
            : status === "loading"
              ? "Loading…"
              : `Pay ${payLabel} now`}
    </button>
</form>

<style>
    .stripe-pay-element-wrap {
        position: relative;
        margin-bottom: 1.5rem;
        min-height: 120px;
    }

    .stripe-pay-loading-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        background: rgba(255, 255, 255, 0.9);
        color: #666;
        font-size: 0.9375rem;
        pointer-events: none;
    }
</style>
