<script lang="ts">
	import { goto } from '$app/navigation';
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { CheckoutOrderSummary, CheckoutDeliveryStep, CheckoutPaymentStep } from '$lib/components/checkout';
	import { client } from '$lib/api/client.js';
	import { cart } from '$lib/stores/cart';
	import type { CartLineItem } from '$lib/stores/cart';

	type CheckoutStep = 'addresses' | 'delivery' | 'payment' | 'review';
	const CART_STORAGE_KEY = 'dm_sf_cart_id';
	const ORDER_CACHE_KEY_PREFIX = 'dm_sf_order_';
	type ApiCartLineItem = { id: string };
	type ApiCart = { id: string; line_items?: ApiCartLineItem[] };
	type LineItemPut = {
		title?: string | null;
		description?: string | null;
		thumbnail?: string | null;
		variant_id?: string | null;
		product_id?: string | null;
		quantity?: number | null;
		unit_price?: string | null;
	};

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
		{ id: 'addresses' as const, label: 'Addresses' },
		{ id: 'delivery' as const, label: 'Delivery' },
		{ id: 'payment' as const, label: 'Payment' },
		{ id: 'review' as const, label: 'Review' }
	];
	let currentStep = $state<CheckoutStep>('addresses');

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
	let shippingMethod = $state('standard-worldwide');
	let paymentMethod = $state('manual');
	let placeOrderError = $state('');
	let isPlacingOrder = $state(false);
	const fullName = $derived(`${shipping.firstName} ${shipping.lastName}`.trim() || '—');
	const shippingLine1 = $derived(shipping.address1 || '—');
	const shippingLine2 = $derived(shipping.address2 || '');
	const shippingLine3 = $derived(
		[shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(', ') || '—'
	);
	const shippingCountry = $derived(shipping.country || '—');
	const shippingMethodLabel = $derived(
		shippingMethod === 'standard-worldwide' ? 'Standard Worldwide Shipping' : shippingMethod
	);
	const paymentMethodLabel = $derived(paymentMethod === 'manual' ? 'Manual Payment' : paymentMethod);

	function goNext() {
		if (currentStep === 'addresses') currentStep = 'delivery';
		else if (currentStep === 'delivery') currentStep = 'payment';
		else if (currentStep === 'payment') currentStep = 'review';
	}

	function goBack() {
		if (currentStep === 'delivery') currentStep = 'addresses';
		else if (currentStep === 'payment') currentStep = 'delivery';
		else if (currentStep === 'review') currentStep = 'payment';
	}

	function orderAddressLines(): string[] {
		return [
			fullName,
			shipping.address1 || shipping.address2 || '—',
			[shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(', ') || '—',
			shipping.country || '—'
		];
	}

	function orderTotals() {
		return {
			subtotal: subtotalDisplay,
			shipping: '$0.00',
			discount: '$0.00',
			tax: '$0.00',
			total: totalDisplay
		};
	}

	function treatyErrorMessage(err: unknown): string {
		const o = err as { value?: { message?: string } };
		return o?.value?.message ?? String(err);
	}

	async function fetchCartJson(cartId: string): Promise<ApiCart> {
		const res = await client.carts({ id: cartId }).get();
		if (res.error) throw new Error(treatyErrorMessage(res.error));
		return res.data as ApiCart;
	}

	async function putLineItems(cartId: string, line_items: LineItemPut[]) {
		const res = await client.carts({ id: cartId })['line-items'].put({ line_items });
		if (res.error) throw new Error(treatyErrorMessage(res.error));
	}

	async function ensureCartHasLineItems(cartId: string) {
		const apiCart = await fetchCartJson(cartId);
		if ((apiCart.line_items?.length ?? 0) > 0) return;
		if (cartItems.length === 0) return;

		const line_items: LineItemPut[] = cartItems
			.map((item) => ({
				title: item.name,
				description: null,
				thumbnail: item.image,
				variant_id: null,
				product_id: null,
				quantity: item.quantity,
				unit_price: String(item.priceValue)
			}))
			.filter((item) => (item.quantity ?? 0) > 0);

		if (line_items.length === 0) return;
		await putLineItems(cartId, line_items);
	}

	async function placeOrder() {
		if (isPlacingOrder) return;
		placeOrderError = '';

		const cartId = localStorage.getItem(CART_STORAGE_KEY);
		if (!cartId) {
			placeOrderError = 'Cart not found. Please return to cart and try again.';
			return;
		}

		isPlacingOrder = true;
		try {
			await ensureCartHasLineItems(cartId);
			const res = await client.orders['from-cart'].post({
				cart_id: cartId,
				metadata: {
					shipping_method: shippingMethodLabel,
					payment_method: paymentMethodLabel
				}
			});
			if (res.error) throw new Error(treatyErrorMessage(res.error));
			const created = res.data as {
				id: string;
				display_id?: number;
				status?: string;
				email?: string | null;
			};
			const orderId = created.id;
			const number =
				typeof created.display_id === 'number' ? String(created.display_id) : 'Pending';
			const cachedOrder = {
				id: orderId,
				number,
				date: new Date().toISOString(),
				status: created.status ?? 'pending',
				email: (created.email ?? email ?? '—') as string,
				items: cartItems.map((item) => ({
					image: item.image ?? '',
					imageAlt: item.name,
					title: item.name,
					variant: item.variant,
					quantity: item.quantity,
					price: item.priceDisplay
				})),
				shippingAddress: orderAddressLines(),
				shippingMethod: shippingMethodLabel,
				billingAddress: orderAddressLines(),
				paymentMethod: paymentMethodLabel,
				totals: orderTotals()
			};
			sessionStorage.setItem(`${ORDER_CACHE_KEY_PREFIX}${orderId}`, JSON.stringify(cachedOrder));
			localStorage.removeItem(CART_STORAGE_KEY);
			goto(`/order/confirmation?order=${orderId}`);
		} catch (error) {
			placeOrderError = error instanceof Error ? error.message : 'Failed to place order.';
		} finally {
			isPlacingOrder = false;
		}
	}

	function sectionTitle(step: CheckoutStep): string {
		switch (step) {
			case 'addresses':
				return 'Addresses';
			case 'delivery':
				return 'Delivery';
			case 'payment':
				return 'Payment';
			case 'review':
				return 'Review';
		}
	}
	function sectionSubtitle(step: CheckoutStep): string | null {
		switch (step) {
			case 'addresses':
				return 'Enter your shipping and billing addresses.';
			case 'delivery':
				return 'Select a shipping method.';
			case 'payment':
				return null;
			case 'review':
				return 'Confirm your order details.';
		}
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
				<h1 class="checkout-title">{sectionTitle(currentStep)}</h1>
				{#if sectionSubtitle(currentStep)}
					<p class="checkout-subtitle">{sectionSubtitle(currentStep)}</p>
				{/if}
			</header>

			{#if currentStep === 'addresses'}
				<form class="addresses-form" onsubmit={(e) => { e.preventDefault(); goNext(); }}>
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

					<button type="submit" class="next-btn full-width">Next</button>
				</form>
			{:else if currentStep === 'delivery'}
				<CheckoutDeliveryStep bind:shippingMethod={shippingMethod} onBack={goBack} onNext={goNext} />
			{:else if currentStep === 'payment'}
				<CheckoutPaymentStep bind:paymentMethod={paymentMethod} onBack={goBack} onNext={goNext} />
			{:else}
				<div class="review-step">
					<section class="review-block">
						<h2 class="review-block-title">Shipping Address</h2>
						<p class="review-line">{fullName}</p>
						<p class="review-line">{shippingLine1}</p>
						{#if shippingLine2}
							<p class="review-line">{shippingLine2}</p>
						{/if}
						<p class="review-line">{shippingLine3}</p>
						<p class="review-line">{shippingCountry}</p>
					</section>
					<section class="review-block">
						<h2 class="review-block-title">Shipping Method</h2>
						<p class="review-method">{shippingMethodLabel} <strong>$0.00</strong></p>
					</section>
					<section class="review-block">
						<h2 class="review-block-title">Billing Address</h2>
						<p class="review-line">{fullName}</p>
						<p class="review-line">{shippingLine1}</p>
						{#if shippingLine2}
							<p class="review-line">{shippingLine2}</p>
						{/if}
						<p class="review-line">{shippingLine3}</p>
						<p class="review-line">{shippingCountry}</p>
					</section>
					<section class="review-block">
						<h2 class="review-block-title">Payment Method</h2>
						<p class="review-method">{paymentMethodLabel}</p>
					</section>
					<p class="review-note">
						When you place your order, your payment will be authorized and we'll start processing your order.
					</p>
					<div class="review-actions">
						<button type="button" class="back-btn" onclick={goBack}>Back</button>
						<button type="button" class="place-order-btn" onclick={placeOrder} disabled={isPlacingOrder}>
							{isPlacingOrder ? 'Placing order...' : 'Place order'}
						</button>
					</div>
					{#if placeOrderError}
						<p class="place-order-error">{placeOrderError}</p>
					{/if}
				</div>
			{/if}
		</div>

		<CheckoutOrderSummary items={cartItems} {subtotalDisplay} {totalDisplay} />
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
	.next-btn.full-width {
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
	.next-btn.full-width:hover {
		background: #1a1a1a;
	}
	.review-step {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.review-block {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.review-block-title {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: #1a1a1a;
	}
	.review-line {
		margin: 0;
		font-size: 0.9375rem;
		color: #444;
		line-height: 1.4;
	}
	.review-method {
		margin: 0;
		font-size: 0.9375rem;
		color: #444;
	}
	.review-note {
		font-size: 0.9375rem;
		color: #666;
		margin: 0;
		line-height: 1.5;
	}
	.review-actions {
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
	.place-order-btn {
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
	.place-order-btn:hover {
		background: #1a1a1a;
	}
	.place-order-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.place-order-error {
		margin: 0.25rem 0 0;
		color: #b42318;
		font-size: 0.875rem;
	}
	@media (max-width: 1024px) {
		.checkout-container {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 640px) {
		.form-row-two,
		.form-row-three {
			grid-template-columns: 1fr;
		}
	}
</style>
