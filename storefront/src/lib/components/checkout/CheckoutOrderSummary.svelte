<script lang="ts">
	import type { CartLineItem } from '$lib/stores/cart';

	type Props = {
		items: CartLineItem[];
		subtotalDisplay: string;
		totalDisplay: string;
	};

	let { items, subtotalDisplay, totalDisplay }: Props = $props();
</script>

<aside class="checkout-summary">
	<h2 class="summary-title">Order Summary</h2>
	<ul class="summary-items">
		{#each items as item (item.key)}
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

<style>
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
	.summary-row dt,
	.summary-row dd {
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
		.checkout-summary {
			position: static;
		}
	}
</style>
