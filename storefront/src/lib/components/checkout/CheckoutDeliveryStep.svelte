<script lang="ts">
	import type { SuperFormData } from 'sveltekit-superforms/client';
	import type { CheckoutFormData } from '$lib/checkout/checkout-form-schema';

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
		<button type="button" class="back-btn" onclick={() => onBack()}>Back</button>
		<button type="submit" class="next-btn">Next</button>
	</div>
</div>

<style>
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.delivery-fields {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.fieldset-delivery {
		border: none;
		padding: 0;
		margin: 0;
	}
	.shipping-method {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		border: 1px solid #1a1a1a;
		padding: 1rem 1.25rem;
		font-size: 0.9375rem;
		color: #1a1a1a;
	}
	.shipping-method input {
		margin: 0;
	}
	.delivery-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.back-btn {
		width: 100%;
		background: #fff;
		color: #2d2d2d;
		border: 1px solid #bdbdbd;
		padding: 1rem 1.5rem;
		margin-top: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		border-radius: 0;
	}
	.back-btn:hover {
		border-color: #999;
		color: #1a1a1a;
	}
	.next-btn {
		width: 100%;
		background: #2d2d2d;
		color: #fff;
		border: none;
		padding: 1rem 1.5rem;
		margin-top: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		border-radius: 0;
	}
	.next-btn:hover {
		background: #1a1a1a;
	}
</style>
