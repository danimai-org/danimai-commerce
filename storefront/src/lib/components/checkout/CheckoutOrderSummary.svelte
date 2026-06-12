<script lang="ts">
	import { formatForCurrency } from '$lib/money';
	import {
		getSelectedCurrencyCode,
		regionState,
	} from '$lib/region/region-state.svelte';

	const currencyCode = $derived.by(() => {
		void regionState.selectedRegionId;
		return getSelectedCurrencyCode();
	});

	type CheckoutCartItem = {
		key: string;
		name: string;
		variant: string;
		image: string | null;
		quantity: number;
		priceValue: number;
	};

	type Props = {
		items: CheckoutCartItem[];
		subtotalDisplay: string;
		discountDisplay: string;
		totalDisplay: string;
	};

	let { items, subtotalDisplay, discountDisplay, totalDisplay }: Props = $props();
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
					{#if item.variant}
						<span class="summary-item-variant">{item.variant}</span>
					{/if}
					<span class="summary-item-qty">Quantity: {item.quantity}</span>
				</div>
				<span class="summary-item-price">{formatForCurrency(item.priceValue * item.quantity, currencyCode)}</span>
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
			<dd>{formatForCurrency(0, currencyCode)}</dd>
		</div>
		<div class="summary-row">
			<dt>Discount</dt>
			<dd>{discountDisplay}</dd>
		</div>
		<div class="summary-row">
			<dt>Tax</dt>
			<dd>{formatForCurrency(0, currencyCode)}</dd>
		</div>
	</dl>
	<div class="summary-total">
		<span>Total</span>
		<strong>{totalDisplay}</strong>
	</div>
	<button type="button" class="add-promo">Add promo code</button>
</aside>
