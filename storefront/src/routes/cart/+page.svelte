<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { cart } from '$lib/stores/cart';
	import type { CartLineItem } from '$lib/stores/cart';

	let { data } = $props();
	const products = $derived(data?.products ?? []);

	let cartItems = $state<CartLineItem[]>([]);
	$effect(() => {
		const unsub = cart.subscribe((s) => {
			cartItems = s.items;
		});
		return unsub;
	});

	const subtotal = $derived(
		cartItems.reduce((sum, i) => sum + i.priceValue * i.quantity, 0)
	);
	const subtotalDisplay = $derived(`$${subtotal.toFixed(2)}`);
	const totalDisplay = $derived(`$${subtotal.toFixed(2)}`);

	function parsePrice(priceStr: string): number {
		const n = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
		return Number.isFinite(n) ? n : 0;
	}

	function quickAdd(e: MouseEvent, product: { name: string; price: string; href: string; image?: string | null }) {
		e.preventDefault();
		e.stopPropagation();
		cart.addItem({
			href: product.href,
			name: product.name,
			priceDisplay: product.price,
			priceValue: parsePrice(product.price),
			image: product.image ?? null,
			variant: 'Default'
		});
	}
</script>

<SiteHeader />

<main class="cart-page">
	<div class="cart-container">
		<div class="cart-main">
			<header class="cart-header">
				<h1 class="cart-title">Shopping Cart</h1>
				<a href="/" class="continue-shopping">Continue shopping</a>
			</header>

			{#if cartItems.length === 0}
				<div class="cart-empty">
					<p>Your cart is empty.</p>
					<a href="/" class="continue-shopping-btn">Continue shopping</a>
				</div>
			{:else}
				<ul class="line-items">
					{#each cartItems as item (item.key)}
						<li class="line-item">
							<a href={item.href} class="line-item-image" style="background-color: #f5f0eb;">
								{#if item.image}
									<img src={item.image} alt="" />
								{/if}
							</a>
							<div class="line-item-details">
								<a href={item.href} class="line-item-name">{item.name}</a>
								<p class="line-item-variant">{item.variant}</p>
								<div class="line-item-actions">
									<div class="quantity-controls">
										<button type="button" class="qty-btn" onclick={() => cart.updateQuantity(item.key, -1)} aria-label="Decrease quantity">−</button>
										<span class="qty-value">{item.quantity}</span>
										<button type="button" class="qty-btn" onclick={() => cart.updateQuantity(item.key, 1)} aria-label="Increase quantity">+</button>
									</div>
									<button type="button" class="remove-btn" onclick={() => cart.removeItem(item.key)} aria-label="Remove item">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
									</button>
								</div>
							</div>
							<p class="line-item-total">${(item.priceValue * item.quantity).toFixed(2)}</p>
						</li>
					{/each}
				</ul>

				<section class="order-notes">
					<h2 class="order-notes-title">ORDER NOTES (OPTIONAL)</h2>
					<textarea class="order-notes-input" placeholder="Special instructions for your order..." rows="4"></textarea>
					<p class="order-notes-desc">Add any special requests or delivery instructions</p>
				</section>
			{/if}
		</div>

		{#if cartItems.length > 0}
			<aside class="order-summary">
				<h2 class="order-summary-title">ORDER SUMMARY</h2>
				<dl class="order-summary-rows">
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
				<a href="/checkout" class="checkout-btn">PROCEED TO CHECKOUT</a>
				<p class="shipping-note">Free shipping on all orders</p>
			</aside>
		{/if}
	</div>

	{#if products.length > 0}
		<section class="complete-look">
			<h2 class="complete-look-title">Complete Your Look</h2>
			<div class="complete-look-grid">
				{#each products.slice(0, 4) as product}
					<a href={product.href} class="look-card" aria-label={product.name}>
						<div class="look-image" style="background-color: {product.bg};">
							{#if product.image}
								<img src={product.image} alt="" />
							{/if}
						</div>
						<button type="button" class="look-quick-add" onclick={(e) => quickAdd(e, product)}>QUICK ADD</button>
						<h3 class="look-name">{product.name}</h3>
						<p class="look-price">{product.price}</p>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</main>

<SiteFooter />

<style>
	.cart-page {
		background: #f5f5f5;
		min-height: 100vh;
		padding-bottom: 2rem;
	}
	.cart-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 3rem;
		align-items: start;
	}
	.cart-main {
		background: #fff;
		border-radius: 8px;
		padding: 2rem;
	}
	.cart-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.cart-title {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
		color: #1a1a1a;
		letter-spacing: -0.02em;
	}
	.continue-shopping {
		font-size: 0.9375rem;
		color: #555;
		text-decoration: none;
	}
	.continue-shopping:hover {
		color: #1a1a1a;
		text-decoration: underline;
	}
	.cart-empty {
		text-align: center;
		padding: 3rem 2rem;
		color: #666;
	}
	.cart-empty p {
		margin: 0 0 1rem;
		font-size: 1rem;
	}
	.continue-shopping-btn {
		display: inline-block;
		background: #2d2d2d;
		color: #fff;
		padding: 0.75rem 1.5rem;
		text-decoration: none;
		font-size: 0.9375rem;
		font-weight: 500;
		border-radius: 6px;
	}
	.continue-shopping-btn:hover {
		background: #1a1a1a;
	}
	.line-items {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.line-item {
		display: grid;
		grid-template-columns: 96px 1fr auto;
		gap: 1.25rem;
		align-items: start;
		padding: 1.5rem 0;
		border-bottom: 1px solid #eee;
	}
	.line-item:last-child {
		border-bottom: none;
	}
	.line-item-image {
		aspect-ratio: 1;
		border-radius: 8px;
		overflow: hidden;
		background: #f5f0eb;
		display: block;
	}
	.line-item-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.line-item-details {
		min-width: 0;
	}
	.line-item-name {
		font-weight: 600;
		font-size: 1rem;
		margin: 0 0 0.25rem;
		color: #1a1a1a;
		text-decoration: none;
		display: block;
	}
	.line-item-name:hover {
		text-decoration: underline;
	}
	.line-item-variant {
		font-size: 0.875rem;
		color: #666;
		margin: 0 0 0.75rem;
	}
	.line-item-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.quantity-controls {
		display: flex;
		align-items: center;
		border: 1px solid #ddd;
		border-radius: 4px;
		overflow: hidden;
	}
	.qty-btn {
		width: 32px;
		height: 32px;
		background: #fff;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		color: #1a1a1a;
	}
	.qty-btn:hover {
		background: #f5f5f5;
	}
	.qty-value {
		min-width: 2rem;
		text-align: center;
		font-size: 0.875rem;
	}
	.remove-btn {
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		color: #666;
	}
	.remove-btn:hover {
		color: #1a1a1a;
	}
	.line-item-total {
		font-weight: 600;
		font-size: 1rem;
		margin: 0;
		color: #1a1a1a;
	}
	.order-notes {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #eee;
	}
	.order-notes-title {
		font-size: 0.6875rem;
		letter-spacing: 0.1em;
		color: #666;
		margin: 0 0 0.75rem;
		font-weight: 600;
	}
	.order-notes-input {
		width: 100%;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 0.9375rem;
		font-family: inherit;
		resize: vertical;
		box-sizing: border-box;
	}
	.order-notes-input::placeholder {
		color: #999;
	}
	.order-notes-desc {
		font-size: 0.8125rem;
		color: #888;
		margin: 0.5rem 0 0;
	}
	.order-summary {
		background: #fff;
		border-radius: 8px;
		padding: 2rem;
		position: sticky;
		top: 6rem;
	}
	.order-summary-title {
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: #1a1a1a;
		margin: 0 0 1.5rem;
	}
	.order-summary-rows {
		margin: 0;
	}
	.summary-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.75rem;
		font-size: 0.9375rem;
		color: #444;
	}
	.summary-row dt, .summary-row dd {
		margin: 0;
	}
	.summary-total {
		display: flex;
		justify-content: space-between;
		margin-top: 1rem;
		padding-top: 1rem;
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
		margin-top: 1rem;
		font-size: 0.875rem;
		color: #555;
		cursor: pointer;
		text-decoration: underline;
	}
	.add-promo:hover {
		color: #1a1a1a;
	}
	.checkout-btn {
		display: block;
		width: 100%;
		background: #2d2d2d;
		color: #fff;
		border: none;
		padding: 1rem 1.5rem;
		margin-top: 1.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-align: center;
		text-decoration: none;
		border-radius: 6px;
		cursor: pointer;
		box-sizing: border-box;
	}
	.checkout-btn:hover {
		background: #1a1a1a;
		color: #fff;
	}
	.shipping-note {
		text-align: center;
		font-size: 0.8125rem;
		color: #666;
		margin: 1rem 0 0;
	}
	.complete-look {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 1.5rem 0;
	}
	.complete-look-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 1.5rem;
		color: #1a1a1a;
		letter-spacing: -0.02em;
	}
	.complete-look-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.5rem;
	}
	.look-card {
		position: relative;
		display: block;
		text-decoration: none;
		color: inherit;
		background: #fff;
		border-radius: 8px;
		overflow: hidden;
	}
	.look-image {
		aspect-ratio: 1;
		overflow: hidden;
		position: relative;
	}
	.look-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.look-quick-add {
		position: absolute;
		bottom: 4rem;
		left: 50%;
		transform: translateX(-50%);
		background: #fff;
		color: #1a1a1a;
		border: none;
		padding: 0.5rem 1rem;
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.2s;
		white-space: nowrap;
	}
	.look-card:hover .look-quick-add {
		opacity: 1;
	}
	.look-name {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0.75rem 1rem 0.25rem;
		text-align: center;
		color: #1a1a1a;
	}
	.look-price {
		font-size: 0.875rem;
		color: #666;
		margin: 0 1rem 1rem;
		text-align: center;
	}
	@media (max-width: 1024px) {
		.cart-container {
			grid-template-columns: 1fr;
		}
		.order-summary {
			position: static;
		}
		.complete-look-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 640px) {
		.line-item {
			grid-template-columns: 72px 1fr;
			gap: 0.75rem;
		}
		.line-item-total {
			grid-column: 2;
			text-align: right;
		}
		.complete-look-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
