<script lang="ts">
    import type { SuperFormData } from "sveltekit-superforms/client";
    import type { CheckoutFormData } from "$lib/checkout/checkout-form-schema";

    interface Props {
        form: SuperFormData<CheckoutFormData>;
        onBack: () => void;
    }

    let { form, onBack }: Props = $props();
</script>

<div class="payment-fields">
    <p class="payment-lead">
        Select a payment method. You won't be charged until you place your
        order.
    </p>
    <fieldset class="fieldset-payment">
        <legend class="visually-hidden">Payment method</legend>
        <label class="payment-method">
            <input
                type="radio"
                name="paymentMethod"
                value="manual"
                bind:group={$form.paymentMethod}
            />
            <span class="payment-method-label">Manual Payment</span>
            <span class="payment-method-icon" aria-hidden="true">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
            </span>
        </label>
    </fieldset>
    <div class="payment-actions">
        <button type="button" class="back-btn" onclick={() => onBack()}
            >Back</button
        >
        <button type="submit" class="next-btn">Next</button>
    </div>
</div>
