<script lang="ts">
	import { formatStoreMoney } from '$lib/money';

	let {
		subtotal,
		shipping = 0,
		discount = 0,
		taxDisplay,
		total,
		promoOpen,
		promoInput = $bindable(''),
		onOpenPromo,
		onApplyPromo,
		onClosePromo
	}: {
		subtotal: number;
		shipping?: number;
		discount?: number;
		taxDisplay: string;
		total: number;
		promoOpen: boolean;
		promoInput: string;
		onOpenPromo: () => void;
		onApplyPromo: () => void;
		onClosePromo: () => void;
	} = $props();
</script>

<aside class="order-summary">
	<h2 class="order-summary-title">ORDER SUMMARY</h2>
	<dl class="order-summary-rows">
		<div class="summary-row">
			<dt>Subtotal</dt>
			<dd>{formatStoreMoney(subtotal)}</dd>
		</div>
		<div class="summary-row">
			<dt>Shipping</dt>
			<dd>{formatStoreMoney(shipping)}</dd>
		</div>
		<div class="summary-row">
			<dt>Discount</dt>
			<dd>{formatStoreMoney(discount)}</dd>
		</div>
		<div class="summary-row">
			<dt>Tax</dt>
			<dd>{taxDisplay}</dd>
		</div>
	</dl>
	<div class="summary-total">
		<span>Total</span>
		<strong>{formatStoreMoney(total)}</strong>
	</div>
	{#if !promoOpen}
		<button type="button" class="add-promo" onclick={onOpenPromo}>Add promo code</button>
	{:else}
		<div class="promo-row">
			<input
				type="text"
				class="promo-input"
				placeholder="Enter code"
				bind:value={promoInput}
				aria-label="Promo code"
			/>
			<button type="button" class="promo-apply" onclick={onApplyPromo}>Apply</button>
			<button type="button" class="promo-cancel" onclick={onClosePromo}>Cancel</button>
		</div>
	{/if}
	<a href="/checkout" class="checkout-btn">PROCEED TO CHECKOUT</a>
	<p class="shipping-note">Free shipping on all orders</p>
</aside>

<style>
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
	.summary-row dt,
	.summary-row dd {
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
	.promo-row {
		display: flex;
		align-items: stretch;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.promo-input {
		flex: 1;
		min-width: 0;
		border: 1px solid #ccc;
		border-radius: 0;
		padding: 0.65rem 0.75rem;
		font-size: 0.875rem;
		box-sizing: border-box;
		background: #fff;
		color: #1a1a1a;
	}
	.promo-input::placeholder {
		color: #888;
	}
	.promo-apply {
		flex-shrink: 0;
		background: #2d2d2d;
		color: #fff;
		border: none;
		border-radius: 0;
		padding: 0 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}
	.promo-apply:hover {
		background: #1a1a1a;
	}
	.promo-cancel {
		flex-shrink: 0;
		background: #fff;
		color: #1a1a1a;
		border: 1px solid #1a1a1a;
		border-radius: 0;
		padding: 0 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}
	.promo-cancel:hover {
		background: #f5f5f5;
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
	@media (max-width: 1024px) {
		.order-summary {
			position: static;
		}
	}
</style>
