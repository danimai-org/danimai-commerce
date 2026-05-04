<script lang="ts">
    import type { SuperFormData } from "sveltekit-superforms/client";
    import type { CheckoutFormData } from "$lib/checkout/checkout-form-schema";

    interface Props {
        form: SuperFormData<CheckoutFormData>;
        onBack: () => void;
    }

    let { form, onBack }: Props = $props();
</script>

<div class="delivery-fields">
    <fieldset class="fieldset-delivery">
        <legend class="visually-hidden">Shipping method</legend>
        <label class="shipping-method">
            <input
                type="radio"
                name="shippingMethod"
                value="standard-worldwide"
                bind:group={$form.shippingMethod}
            />
            <span>Standard Worldwide Shipping</span>
        </label>
    </fieldset>
    <div class="delivery-actions">
        <button type="button" class="back-btn" onclick={() => onBack()}
            >Back</button
        >
        <button type="submit" class="next-btn">Next</button>
    </div>
</div>
