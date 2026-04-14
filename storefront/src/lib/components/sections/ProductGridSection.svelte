<script lang="ts">
	import { getUserCart, useCart } from '$lib/hooks/use-cart.hook';
	import { cart } from '$lib/stores/cart';
	import type { ProductGridItem } from '../../../routes/store/+page.ts';

	const { updateCartLineItems, refetchCart } = useCart();	
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

	function parsePrice(price: string | number | null | undefined): number {
		if (typeof price === 'number') {
			return Number.isFinite(price) ? price : 0;
		}
		if (typeof price === 'string') {
			const trimmed = price.trim();
			if (!trimmed || trimmed === '—') {
				return 0;
			}
			const n = parseFloat(trimmed.replace(/[^0-9.]/g, ''));
			return Number.isFinite(n) ? n : 0;
		}
		return 0;
	}

	function displayPrice(price: string | number | null | undefined): string {
		if (typeof price === 'number') {
			return Number.isFinite(price) ? `$${price.toFixed(2)}` : '—';
		}
		if (typeof price === 'string') {
			const trimmed = price.trim();
			if (!trimmed || trimmed === '—') {
				return '—';
			}
			if (/^[$A-Za-z]/.test(trimmed)) {
				return trimmed;
			}
			const parsed = parsePrice(trimmed);
			return parsed > 0 ? `$${parsed.toFixed(2)}` : '—';
		}
		return '—';
	}

	async function quickAdd(e: MouseEvent, product: ProductGridItem) {
		e.preventDefault();
		if (!product.variantId) return;
		const cartId = getUserCart()?.id;
		if (!cartId) return;
		cart.open();
		await updateCartLineItems.mutateAsync({
			id: cartId,
			lineItems: [{
				variant_id: product.variantId,
				quantity: 1,
			}]
		});
		await refetchCart.refetch();
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
			{#if catalogMode}
				<article class="product-card catalog-card">
					<a href={product.href} class="product-card-link" aria-label={product.name}>
						<div class="product-image" style="background-color: {product.bg};">
							{#if product.image}
								<img src={product.image} alt="" class="product-img" />
							{/if}
						</div>
						<div class="product-meta">
							<h3 class="product-name">{product.name}</h3>
							<p class="product-price">
								{displayPrice(product.price.amount)}
							</p>
						</div>
					</a>
					<button type="button" class="quick-add" onclick={(e) => quickAdd(e, product)}>
						QUICK ADD
					</button>
				</article>
			{:else}
				<article class="product-card retail-card">
					<div class="retail-card-surface">
						<a href={product.href} class="retail-image-link" aria-label={`View ${product.name}`}>
							<div
								class="retail-product-image"
								style:background-color={product.image ? '#ffffff' : product.bg}
							>
								{#if product.image}
									<img src={product.image} alt="" class="retail-product-img" />
								{/if}
							</div>
						</a>
						<div class="retail-body">
							<div class="retail-title-row">
								<a href={product.href} class="retail-title-link">
									<h3 class="retail-name">{product.name}</h3>
								</a>
							</div>
							<p class="retail-mrp">
								<span class="mrp-label">Price</span>
								<span class="mrp-value">{displayPrice(product.price.amount)}</span>
							</p>
							
						</div>
						<button type="button" class="retail-add-cart" onclick={(e) => quickAdd(e, product)}>
							Add to Cart
						</button>
					</div>
				</article>
			{/if}
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

	.catalog-card {
		position: relative;
		display: block;
	}
	.catalog-card .product-card-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}
	.catalog-card .product-image {
		position: relative;
		aspect-ratio: 1;
		border-radius: 0;
		margin-bottom: 0.75rem;
		overflow: hidden;
		background: #e8e8e8;
	}
	.catalog-card .product-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.catalog-card .quick-add {
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
	.catalog-card:hover .quick-add {
		opacity: 1;
	}
	.catalog-card .product-name {
		font-size: 0.9375rem;
		font-weight: 600;
		margin: 0 0 0.25rem;
		text-align: center;
	}
	.catalog-card .product-price {
		font-size: 0.875rem;
		color: #666;
		margin: 0;
		text-align: center;
	}

	.retail-card {
		display: flex;
		min-height: 0;

	}
	.retail-card-surface {
		display: flex;
		flex-direction: column;
		width: 100%;
		background: #fff;
		border: 1px solid #d9d9d9;
		border-radius: 8px;
		overflow: hidden;
		box-sizing: border-box;
	}
	.retail-image-link {
		display: block;
		text-decoration: none;
		color: inherit;
		flex-shrink: 0;
	}
	.retail-product-image {
		position: relative;
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: #fff;
	}
	.retail-product-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 0.75rem;
		box-sizing: border-box;
	}
	.retail-body {
		padding: 0.75rem 1rem 0.5rem;
		flex: 1;
		min-height: 0;
	}
	.retail-title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.retail-title-link {
		flex: 1;
		min-width: 0;
		text-decoration: none;
		color: inherit;
	}
	.retail-name {
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1.35;
		margin: 0;
		text-align: left;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}

	.retail-mrp {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 700;
		color: #1a1a1a;
	}
	.mrp-label {
		font-weight: 700;
		margin-right: 0.35rem;
	}
	.mrp-value {
		font-weight: 700;
	}
	.retail-add-cart {
		box-sizing: border-box;
		margin-top: auto;
		margin-inline: 0.75rem;
		margin-bottom: 0.75rem;
		padding: 0.6875rem 1.75rem;
		width: calc(100% - 1.5rem);
		align-self: center;
		border: none;
		border-radius: 8px;
		background: #808050;
		color: #fff;
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.9375rem;
		font-weight: 600;
		text-align: center;
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.retail-add-cart:hover {
		background: #6d6d45;
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

