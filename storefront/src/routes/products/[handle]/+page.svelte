<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import { ProductGridSection } from '$lib/components/sections';
	import {
		ProductGallery,
		ProductDetails,
		ProductInfoBlocks,
		ProductError,
		type VariantItem,
		type AccordionItem
	} from '$lib/components/product';

	let { data } = $props();
	const product = $derived(data?.product ?? null);
	const variants = $derived(data?.variants ?? []);
	const otherProducts = $derived(data?.otherProducts ?? []);
	const error = $derived(data?.error ?? null);

	let selectedVariantId = $state<string | null>(null);
	let quantity = $state(1);
	let selectedImageUrl = $state<string | null>(null);

	$effect(() => {
		if (variants.length > 0 && selectedVariantId === null) {
			selectedVariantId = variants[0].id;
		}
	});

	const selectedVariant = $derived(variants.find((v) => v.id === selectedVariantId) ?? variants[0]);
	const galleryImages = $derived([
		product?.thumbnail,
		...(variants.map((v) => v.thumbnail).filter(Boolean) as string[])
	].filter((url): url is string => !!url));
	const mainImage = $derived(selectedImageUrl ?? product?.thumbnail ?? selectedVariant?.thumbnail ?? galleryImages[0] ?? null);

	const variantItems: VariantItem[] = $derived(
		variants.map((v) => ({ id: v.id, title: v.title ?? '', priceDisplay: v.priceDisplay ?? '—' }))
	);

	const accordionItems: AccordionItem[] = $derived([
		{
			key: 'details',
			title: 'PRODUCT DETAILS',
			content: '<p>Premium materials, designed for everyday wear. See Fabric & Care for composition.</p>'
		},
		{
			key: 'fit',
			title: 'FIT & SIZE',
			content: '<p>Regular fit. We recommend ordering your usual size. For guidance, see our size guide.</p>'
		},
		{
			key: 'fabric',
			title: 'FABRIC & CARE',
			content: '<p>Check the care label on your garment for specific instructions. Machine wash cold, tumble dry low.</p>'
		},
		{
			key: 'shipping',
			title: 'SHIPPING & RETURNS',
			content: '<p><strong>Free Shipping</strong> — Enjoy free standard shipping on all orders. Express shipping available at an additional cost.</p><p><strong>Hassle-Free Returns</strong> — Not completely satisfied? We\'ll gladly offer you a refund within 30 days of your purchase. Return shipping is not included.</p>'
		}
	]);

	const tagline = $derived(
		product?.subtitle || (product?.description ? product.description.replace(/<[^>]+>/g, '').slice(0, 200) : '') || ''
	);
</script>

<SiteHeader />

{#if error || !product}
	<ProductError message={error ?? 'Product not found'} />
{:else}
	<main class="product-page">
		<div class="product-layout">
			<ProductGallery
				images={galleryImages}
				mainImage={mainImage ?? ''}
				alt={product.title}
				bind:selectedImageUrl
			/>
			<ProductDetails
				title={product.title}
				priceLabel={selectedVariant?.priceDisplay ?? product.priceLabel ?? '—'}
				tagline={tagline}
				variants={variantItems}
				bind:selectedVariantId
				bind:quantity
				accordionItems={accordionItems}
				productHref={product ? `/products/${product.handle}` : ''}
				productImage={mainImage}
				selectedVariantTitle={selectedVariant?.title ?? ''}
			/>
		</div>

		<ProductInfoBlocks />

		{#if otherProducts.length > 0}
			<section class="also-like">
				<h2 class="also-like-title">You May Also Like</h2>
				<ProductGridSection products={otherProducts} title="" subtitle="" />
			</section>
		{/if}
	</main>
{/if}

<SiteFooter />

<style>
	.product-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}
	.product-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: start;
	}
	.also-like {
		margin-top: 4rem;
	}
	.also-like-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 1.5rem;
		text-align: center;
		color: #1a1a1a;
	}
	:global(.also-like .section-title) {
		display: none;
	}
	:global(.also-like .section-subtitle) {
		display: none;
	}
	@media (max-width: 900px) {
		.product-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
