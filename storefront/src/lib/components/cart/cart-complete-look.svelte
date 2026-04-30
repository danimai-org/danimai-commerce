<script lang="ts">
	import CartProductCard from "./cart-product-card.svelte";

	type ProductItem = { id: string; title: string; handle: string; thumbnail?: string | null };
	type LookExtra = { image: string | null; priceDisplay: string };

	let {
		products,
		lookExtrasByProductId,
		onQuickAdd
	}: {
		products: ProductItem[];
		lookExtrasByProductId: Map<string, LookExtra>;
		onQuickAdd: (e: MouseEvent, product: { id: string; title: string; handle: string }) => void;
	} = $props();
</script>

<section class="complete-look">
	<h2 class="complete-look-title">Complete Your Look</h2>
	<div class="complete-look-grid">
		{#each products.slice(0, 4) as product}
			{@const extra = lookExtrasByProductId.get(product.id)}
			{@const imgUrl = extra?.image ?? product.thumbnail ?? null}
			<CartProductCard
				href={`/products/${product.handle}`}
				title={product.title}
				priceDisplay={extra?.priceDisplay ?? '—'}
				image={imgUrl}
				onAddToCart={(e) =>
					onQuickAdd(e, { id: product.id, title: product.title, handle: product.handle })}
			/>
		{/each}
	</div>
</section>

<style>
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
	@media (max-width: 1024px) {
		.complete-look-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 640px) {
		.complete-look-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
