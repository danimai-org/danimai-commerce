<script lang="ts">
	import { cart } from '$lib/stores/cart';
	import ProductVariantSelect from './ProductVariantSelect.svelte';
	import ProductQuantity from './ProductQuantity.svelte';
	import ProductAccordions from './ProductAccordions.svelte';
	import type { VariantItem } from './ProductVariantSelect.svelte';
	import type { AccordionItem } from './ProductAccordions.svelte';

	let {
		title = '',
		priceLabel = '—',
		tagline = '',
		variants = [] as VariantItem[],
		selectedVariantId = $bindable(null as string | null),
		quantity = $bindable(1),
		accordionItems = [] as AccordionItem[],
		productHref = '',
		productImage = null as string | null,
		selectedVariantTitle = ''
	}: {
		title?: string;
		priceLabel?: string;
		tagline?: string;
		variants?: VariantItem[];
		selectedVariantId?: string | null;
		quantity?: number;
		accordionItems?: AccordionItem[];
		productHref?: string;
		productImage?: string | null;
		selectedVariantTitle?: string;
	} = $props();

	function parsePrice(str: string): number {
		const n = parseFloat(str.replace(/[^0-9.]/g, ''));
		return Number.isFinite(n) ? n : 0;
	}

	function addToCart() {
		const priceValue = parsePrice(priceLabel);
		cart.addItem({
			href: productHref || `/products/${title.toLowerCase().replace(/\s+/g, '-')}`,
			name: title,
			priceDisplay: priceLabel,
			priceValue,
			image: productImage,
			variant: selectedVariantTitle || 'Default',
			quantity
		});
		cart.open();
	}
</script>

<div class="product-details">
	<h1 class="product-title">{title}</h1>
	<p class="product-price">{priceLabel}</p>

	<ProductVariantSelect variants={variants} bind:selectedVariantId />

	<ProductQuantity bind:quantity />

	<button type="button" class="add-to-cart" onclick={addToCart}>ADD TO CART</button>

	{#if tagline}
		<p class="product-tagline">{tagline}</p>
	{/if}

	{#if accordionItems.length > 0}
		<ProductAccordions items={accordionItems} defaultOpenKey="shipping" />
	{/if}

	<button type="button" class="share-link">
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
		Share Product
	</button>
</div>

<style>
	.product-details {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.product-title {
		font-size: clamp(1.5rem, 2.5vw, 2rem);
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.02em;
		color: #1a1a1a;
	}
	.product-price {
		font-size: 1.125rem;
		color: #1a1a1a;
		margin: 0;
	}
	.add-to-cart {
		width: 100%;
		padding: 1rem 1.5rem;
		background: #1a1a1a;
		color: #fff;
		border: none;
		font-size: 0.8125rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		font-weight: 500;
		cursor: pointer;
		border-radius: 4px;
	}
	.add-to-cart:hover {
		background: #333;
	}
	.product-tagline {
		font-size: 0.9375rem;
		color: #555;
		line-height: 1.5;
		margin: 0;
	}
	.share-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #1a1a1a;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		margin-top: 0.5rem;
	}
	.share-link:hover {
		text-decoration: underline;
	}
</style>
