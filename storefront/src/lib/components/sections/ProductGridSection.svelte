<script lang="ts">
	import { cart } from '$lib/stores/cart';
	import type { ProductGridItem } from '../../../routes/store/+page.ts';


	let {
		products = [] as ProductGridItem[] | undefined,
		title = 'Essential essentials for everyday.',
		subtitle = 'A collection of versatile pieces for your daily movement.',
		catalogMode = false
	}: {
		products?: ProductGridItem[] | undefined;
		title?: string;
		subtitle?: string;
		catalogMode?: boolean;
	} = $props();

	function parsePrice(priceInput: string | number | null | undefined): number {
		if (typeof priceInput === 'number') {
			return Number.isFinite(priceInput) ? priceInput : 0;
		}
		if (typeof priceInput !== 'string') {
			return 0;
		}
		const n = parseFloat(priceInput.replace(/[^0-9.]/g, ''));
		return Number.isFinite(n) ? n : 0;
	}

	function quickAdd(e	: MouseEvent, product: ProductGridItem) {
		cart.addItem({
			href: product.href,
			name: product.name,
			priceDisplay: `$${parsePrice(product.price).toFixed(2)}`,
			priceValue: parsePrice(product.price),
			image: product.image ?? null,
			variant: 'Default'
		});
	}
</script>

<section class="section products-section" class:catalog-mode={catalogMode}>
	{#if title}
		<h2 class="section-title">{title}</h2>
	{/if}
	{#if subtitle}
		<p class="section-subtitle">{subtitle}</p>
	{/if}
	<div class="product-grid">
		{#each products as product}
			<article class="product-card">
				<a href={product.href} class="product-card-link" aria-label={product.name}>
					<div class="product-image" style="background-color: {product.bg};">
						{#if product.image}
							<img src={product.image} alt="" class="product-img" />
						{/if}
					</div>
					<div class="product-meta">
						<h3 class="product-name">{product.name}</h3>
						<p class="product-price">${parsePrice(product.price).toFixed(2)}</p>
					</div>
				</a>
				<button type="button" class="quick-add" onclick={(e) => quickAdd(e, product)}>QUICK ADD</button>
			</article>
		{/each}
	</div>
</section>

<style>
	.section {
		max-width: var(--section-max-width, 1200px);
		margin: 0 auto;
		padding: var(--section-padding-y, 4rem) var(--section-padding-x, 1.5rem);
		box-sizing: border-box;
	}
	.section-title {
		font-family: var(--font-serif, Georgia, serif);
		font-size: clamp(1.5rem, 3vw, 2.125rem);
		font-weight: 600;
		text-align: center;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
	}
	.section-subtitle {
		text-align: center;
		margin: 0 0 2.5rem;
		color: #555;
		font-size: 0.9375rem;
		line-height: 1.55;
		max-width: 36rem;
		margin-left: auto;
		margin-right: auto;
	}
	.product-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: clamp(1rem, 2vw, 1.75rem);
	}
	.product-card {
		position: relative;
		display: block;
	}
	.product-card-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}
	.product-image {
		position: relative;
		aspect-ratio: 1;
		border-radius: 0;
		margin-bottom: 0.75rem;
		overflow: hidden;
		background: #e8e8e8;
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
		z-index: 1;
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
	@media (max-width: 1024px) {
		.product-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	.catalog-mode {
		padding-top: 1rem;
	}
	.catalog-mode .product-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.5rem;
	}
	.catalog-mode .product-name {
		text-align: left;
		font-weight: 500;
		font-size: 0.95rem;
		margin: 0;
	}
	.catalog-mode .product-price {
		text-align: right;
		color: #1a1a1a;
		font-size: 1rem;
		margin: 0;
		font-weight: 500;
	}
	.catalog-mode .product-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
	@media (max-width: 1024px) {
		.catalog-mode .product-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 640px) {
		.catalog-mode .product-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
