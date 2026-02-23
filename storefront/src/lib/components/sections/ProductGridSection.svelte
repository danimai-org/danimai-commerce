<script lang="ts">
	import { cart } from '$lib/stores/cart';

	interface Product {
		name: string;
		price: string;
		href: string;
		bg: string;
		image?: string | null;
	}

	let {
		products = [],
		title = 'Elevated essentials for everyday.',
		subtitle = 'Functional athleisure made of premium materials to improve your life in small but mighty ways.'
	}: {
		products?: Product[];
		title?: string;
		subtitle?: string;
	} = $props();

	function parsePrice(priceStr: string): number {
		const n = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
		return Number.isFinite(n) ? n : 0;
	}

	function quickAdd(e: MouseEvent, product: Product) {
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

<section class="section products-section">
	{#if title}
		<h2 class="section-title">{title}</h2>
	{/if}
	{#if subtitle}
		<p class="section-subtitle">{subtitle}</p>
	{/if}
	<div class="product-grid">
		{#each products as product}
			<a href={product.href} class="product-card" aria-label={product.name}>
				<div class="product-image" style="background-color: {product.bg};">
					{#if product.image}
						<img src={product.image} alt="" class="product-img" />
					{/if}
				</div>
				<button type="button" class="quick-add" onclick={(e) => quickAdd(e, product)}>QUICK ADD</button>
				<h3 class="product-name">{product.name}</h3>
				<p class="product-price">{product.price}</p>
			</a>
		{/each}
	</div>
</section>

<style>
	.section {
		max-width: 1200px;
		margin: 0 auto;
		padding: 4rem 1.5rem;
	}
	.section-title {
		font-size: clamp(1.5rem, 3vw, 2rem);
		font-weight: 700;
		text-align: center;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
	}
	.section-subtitle {
		text-align: center;
		margin: 0 0 2rem;
		color: #555;
		font-size: 0.9375rem;
		max-width: 560px;
		margin-left: auto;
		margin-right: auto;
	}
	.product-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.5rem;
	}
	.product-card {
		position: relative;
		display: block;
		text-decoration: none;
		color: inherit;
	}
	.product-image {
		position: relative;
		aspect-ratio: 1;
		border-radius: 8px;
		margin-bottom: 0.75rem;
		overflow: hidden;
	}
	.product-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.quick-add {
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
	}
	.product-card:hover .quick-add {
		opacity: 1;
	}
	.product-name {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0 0 0.25rem;
		text-align: center;
	}
	.product-price {
		font-size: 0.875rem;
		color: #666;
		margin: 0;
		text-align: center;
	}
	@media (max-width: 900px) {
		.product-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
