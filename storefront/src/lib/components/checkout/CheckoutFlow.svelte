<script lang="ts">
    import CheckoutOrderSummary from "./CheckoutOrderSummary.svelte";
    import CheckoutAddressStep from "./CheckoutAddressStep.svelte";
    import CheckoutDeliveryStep from "./CheckoutDeliveryStep.svelte";
    import CheckoutPaymentStep from "./CheckoutPaymentStep.svelte";

    type CheckoutStep = "addresses" | "delivery" | "payment" | "review";
    type CheckoutProgressStep = { id: CheckoutStep; label: string };
    type CheckoutCartItem = {
        key: string;
        name: string;
        variant: string;
        image: string | null;
        quantity: number;
        priceValue: number;
        priceDisplay: string;
    };

    let {
        steps,
        currentStep,
        sectionTitle,
        sectionSubtitle,
        enhance,
        form,
        errors,
        constraints,
        goBack,
        items,
        subtotalDisplay,
        discountDisplay,
        totalDisplay,
        reviewAddressLines,
        reviewShippingMethod,
        reviewPaymentMethod,
        isPlacingOrder,
        placeOrderError,
        onPlaceOrder,
    }: {
        steps: CheckoutProgressStep[];
        currentStep: CheckoutStep;
        sectionTitle: (step: CheckoutStep) => string;
        sectionSubtitle: (step: CheckoutStep) => string | null;
        enhance: any;
        form: any;
        errors: any;
        constraints: any;
        goBack: () => void;
        items: CheckoutCartItem[];
        subtotalDisplay: string;
        discountDisplay: string;
        totalDisplay: string;
        reviewAddressLines: () => string[];
        reviewShippingMethod: () => string;
        reviewPaymentMethod: () => string;
        isPlacingOrder: boolean;
        placeOrderError: string;
        onPlaceOrder: () => void | Promise<void>;
    } = $props();
</script>

<main class="checkout-page">
    <nav class="checkout-steps" aria-label="Checkout progress">
        {#each steps as step}
            <span class="step {step.id === currentStep ? 'step-current' : ''}"
                >{step.label}</span
            >
            {#if step !== steps[steps.length - 1]}
                <span class="step-sep" aria-hidden="true">|</span>
            {/if}
        {/each}
    </nav>

    <div class="checkout-container">
        <div class="checkout-main">
            <header class="checkout-section-header">
                <h1 class="checkout-title">{sectionTitle(currentStep)}</h1>
                {#if sectionSubtitle(currentStep)}
                    <p class="checkout-subtitle">
                        {sectionSubtitle(currentStep)}
                    </p>
                {/if}
            </header>

            {#if currentStep !== "review"}
                <form class="checkout-flow-form" method="POST" use:enhance>
                    {#if currentStep === "addresses"}
                        <CheckoutAddressStep {form} {errors} {constraints} />
                    {:else if currentStep === "delivery"}
                        <CheckoutDeliveryStep {form} onBack={goBack} />
                    {:else if currentStep === "payment"}
                        <CheckoutPaymentStep {form} onBack={goBack} />
                    {/if}
                </form>
            {:else}
                <section class="review-step">
                    <div class="review-block">
                        <h2 class="review-block-title">Shipping Address</h2>
                        {#each reviewAddressLines() as line}
                            <p class="review-line">{line}</p>
                        {/each}
                    </div>
                    <div class="review-block">
                        <h2 class="review-block-title">Shipping Method</h2>
                        <p class="review-method">{reviewShippingMethod()}</p>
                    </div>
                    <div class="review-block">
                        <h2 class="review-block-title">Payment Method</h2>
                        <p class="review-method">{reviewPaymentMethod()}</p>
                    </div>
                    <p class="review-note">
                        By placing your order, you agree to our terms and
                        conditions.
                    </p>
                    <div class="review-actions">
                        <button type="button" class="back-btn" onclick={goBack}>
                            Back
                        </button>
                        <button
                            type="button"
                            class="place-order-btn"
                            onclick={onPlaceOrder}
                            disabled={isPlacingOrder}
                        >
                            {isPlacingOrder ? "Placing..." : "Place Order"}
                        </button>
                    </div>
                    {#if placeOrderError}
                        <p class="place-order-error">{placeOrderError}</p>
                    {/if}
                </section>
            {/if}
        </div>

        <CheckoutOrderSummary
            {items}
            {subtotalDisplay}
            {discountDisplay}
            {totalDisplay}
        />
    </div>
</main>
