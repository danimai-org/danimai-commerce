<script lang="ts">
	import { goto } from '$app/navigation';
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { cart } from '$lib/stores/cart';
	import type { CartLineItem } from '$lib/stores/cart';

	let cartItems = $state<CartLineItem[]>([]);
	$effect(() => {
		const unsub = cart.subscribe((s) => {
			cartItems = s.items;
		});
		return unsub;
	});

	$effect(() => {
		if (cartItems.length === 0 && typeof window !== 'undefined') {
			goto('/cart');
		}
	});

	const subtotal = $derived(
		cartItems.reduce((sum, i) => sum + i.priceValue * i.quantity, 0)
	);
	const subtotalDisplay = $derived(`$${subtotal.toFixed(2)}`);
	const totalDisplay = $derived(`$${subtotal.toFixed(2)}`);

	const steps = [
		{ id: 'addresses', label: 'Addresses' },
		{ id: 'delivery', label: 'Delivery' },
		{ id: 'payment', label: 'Payment' },
		{ id: 'review', label: 'Review' }
	];
	const currentStep = 'addresses';

	let shipping = $state({
		firstName: '',
		lastName: '',
		company: '',
		address1: '',
		address2: '',
		city: '',
		state: '',
		postalCode: '',
		country: 'United States',
		phone: ''
	});
	let billingSameAsShipping = $state(true);
	let email = $state('');

	function handleNext() {
		// Navigate to delivery step when implemented
	}
</script>

<SiteHeader />

<main class="checkout-page">
	<nav class="checkout-steps" aria-label="Checkout progress">
		{#each steps as step}
			<span class="step {step.id === currentStep ? 'step-current' : ''}">{step.label}</span>
			{#if step !== steps[steps.length - 1]}
				<span class="step-sep" aria-hidden="true">|</span>
			{/if}
		{/each}
	</nav>

	<div class="checkout-container">
		<div class="checkout-main">
			<header class="checkout-section-header">
				<h1 class="checkout-title">Addresses</h1>
				<p class="checkout-subtitle">Enter your shipping and billing addresses.</p>
			</header>

			<form class="addresses-form" onsubmit={(e) => { e.preventDefault(); handleNext(); }}>
				<fieldset class="fieldset-shipping">
					<legend class="visually-hidden">Shipping address</legend>
					<div class="form-row form-row-two">
						<div class="field">
							<label for="shipping-first-name">First Name</label>
							<input id="shipping-first-name" type="text" bind:value={shipping.firstName} placeholder="First name" />
						</div>
						<div class="field">
							<label for="shipping-last-name">Last Name</label>
							<input id="shipping-last-name" type="text" bind:value={shipping.lastName} placeholder="Last name" />
						</div>
					</div>
					<div class="field">
						<label for="shipping-company">Company</label>
						<input id="shipping-company" type="text" bind:value={shipping.company} placeholder="Company name" />
					</div>
					<div class="field">
						<label for="shipping-address1">Address Line 1</label>
						<input id="shipping-address1" type="text" bind:value={shipping.address1} placeholder="Address line 1" />
					</div>
					<div class="field">
						<label for="shipping-address2">Address Line 2</label>
						<input id="shipping-address2" type="text" bind:value={shipping.address2} placeholder="Address line 2" />
					</div>
					<div class="form-row form-row-three">
						<div class="field">
							<label for="shipping-city">City</label>
							<input id="shipping-city" type="text" bind:value={shipping.city} placeholder="City" />
						</div>
						<div class="field">
							<label for="shipping-state">State / Province</label>
							<input id="shipping-state" type="text" bind:value={shipping.state} placeholder="State / Province" />
						</div>
						<div class="field">
							<label for="shipping-postal">Postal Code</label>
							<input id="shipping-postal" type="text" bind:value={shipping.postalCode} placeholder="Postal code" />
						</div>
					</div>
					<div class="field">
						<label for="shipping-country">Country</label>
						<select id="shipping-country" bind:value={shipping.country}>
							<option>United States</option>
							<option>Canada</option>
							<option>United Kingdom</option>
						</select>
					</div>
					<div class="field">
						<label for="shipping-phone">Phone</label>
						<input id="shipping-phone" type="tel" bind:value={shipping.phone} placeholder="Phone number" />
					</div>
				</fieldset>

				<label class="checkbox-row">
					<input type="checkbox" bind:checked={billingSameAsShipping} />
					<span>Billing address is the same as shipping address</span>
				</label>

				<div class="field email-field">
					<label for="email">Email Address</label>
					<input id="email" type="email" bind:value={email} placeholder="Email address" />
					<p class="field-hint">You'll receive order updates to this email</p>
				</div>

				<button type="submit" class="next-btn">Next</button>
			</form>
		</div>

		<aside class="checkout-summary">
			<h2 class="summary-title">Order Summary</h2>
			<ul class="summary-items">
				{#each cartItems as item (item.key)}
					<li class="summary-item">
						<div class="summary-item-image" style="background-color: #f5f0eb;">
							{#if item.image}
								<img src={item.image} alt="" />
							{/if}
						</div>
						<div class="summary-item-details">
							<span class="summary-item-name">{item.name}</span>
							<span class="summary-item-variant">{item.variant}</span>
							<span class="summary-item-qty">Quantity: {item.quantity}</span>
						</div>
						<span class="summary-item-price">${(item.priceValue * item.quantity).toFixed(2)}</span>
					</li>
				{/each}
			</ul>
			<dl class="summary-rows">
				<div class="summary-row">
					<dt>Subtotal</dt>
					<dd>{subtotalDisplay}</dd>
				</div>
				<div class="summary-row">
					<dt>Shipping</dt>
					<dd>$0.00</dd>
				</div>
				<div class="summary-row">
					<dt>Discount</dt>
					<dd>$0.00</dd>
				</div>
				<div class="summary-row">
					<dt>Tax</dt>
					<dd>$0.00</dd>
				</div>
			</dl>
			<div class="summary-total">
				<span>Total</span>
				<strong>{totalDisplay}</strong>
			</div>
			<button type="button" class="add-promo">Add promo code</button>
		</aside>
	</div>
</main>

<SiteFooter />

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
	.checkout-page {
		background: #fff;
		min-height: 100vh;
		padding-bottom: 2rem;
	}
	.checkout-steps {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.25rem 1.5rem;
		font-size: 0.9375rem;
		color: #888;
	}
	.step {
		color: inherit;
	}
	.step-current {
		color: #2d2d2d;
		font-weight: 600;
	}
	.step-sep {
		margin: 0 0.5rem;
		color: #ccc;
	}
	.checkout-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem 2rem;
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 3rem;
		align-items: start;
	}
	.checkout-main {
		min-width: 0;
	}
	.checkout-section-header {
		margin-bottom: 2rem;
	}
	.checkout-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
		color: #1a1a1a;
		letter-spacing: -0.02em;
	}
	.checkout-subtitle {
		font-size: 0.9375rem;
		color: #666;
		margin: 0;
	}
	.addresses-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.fieldset-shipping {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.form-row {
		display: grid;
		gap: 1rem;
	}
	.form-row-two {
		grid-template-columns: 1fr 1fr;
	}
	.form-row-three {
		grid-template-columns: 1fr 1fr 1fr;
	}
	.field label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #333;
		margin-bottom: 0.35rem;
	}
	.field input,
	.field select {
		width: 100%;
		padding: 0.65rem 0.75rem;
		font-size: 0.9375rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: #fff;
		color: #1a1a1a;
		font-family: inherit;
		box-sizing: border-box;
	}
	.field input::placeholder {
		color: #999;
	}
	.field input:focus,
	.field select:focus {
		outline: none;
		border-color: #2d2d2d;
	}
	.field-hint {
		font-size: 0.8125rem;
		color: #888;
		margin: 0.35rem 0 0;
	}
	.checkbox-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		color: #333;
		cursor: pointer;
	}
	.checkbox-row input {
		width: auto;
	}
	.email-field {
		margin-top: 0.5rem;
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
		border-radius: 6px;
	}
	.next-btn:hover {
		background: #1a1a1a;
	}
	.checkout-summary {
		background: #f8f8f8;
		border-radius: 8px;
		padding: 1.5rem;
		position: sticky;
		top: 6rem;
	}
	.summary-title {
		font-size: 1rem;
		font-weight: 700;
		margin: 0 0 1.25rem;
		color: #1a1a1a;
	}
	.summary-items {
		list-style: none;
		margin: 0;
		padding: 0 0 1rem;
		border-bottom: 1px solid #eee;
	}
	.summary-item {
		display: grid;
		grid-template-columns: 56px 1fr auto;
		gap: 0.75rem;
		align-items: start;
		padding: 0.75rem 0;
	}
	.summary-item:not(:last-child) {
		border-bottom: 1px solid #eee;
	}
	.summary-item-image {
		aspect-ratio: 1;
		border-radius: 6px;
		overflow: hidden;
		background: #f5f0eb;
	}
	.summary-item-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.summary-item-details {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}
	.summary-item-name {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #1a1a1a;
	}
	.summary-item-variant {
		font-size: 0.8125rem;
		color: #666;
	}
	.summary-item-qty {
		font-size: 0.8125rem;
		color: #666;
	}
	.summary-item-price {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #1a1a1a;
	}
	.summary-rows {
		margin: 0;
		padding: 1rem 0 0;
	}
	.summary-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 0.9375rem;
		color: #444;
	}
	.summary-row dt, .summary-row dd {
		margin: 0;
	}
	.summary-total {
		display: flex;
		justify-content: space-between;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #ddd;
		font-size: 1rem;
	}
	.summary-total strong {
		font-size: 1.125rem;
	}
	.add-promo {
		display: block;
		background: none;
		border: none;
		padding: 0;
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: #555;
		cursor: pointer;
		text-decoration: underline;
	}
	.add-promo:hover {
		color: #1a1a1a;
	}
	@media (max-width: 1024px) {
		.checkout-container {
			grid-template-columns: 1fr;
		}
		.checkout-summary {
			position: static;
		}
	}
	@media (max-width: 640px) {
		.form-row-two,
		.form-row-three {
			grid-template-columns: 1fr;
		}
	}
</style>
