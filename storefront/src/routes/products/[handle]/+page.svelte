<script lang="ts">
    import { SiteHeader, SiteFooter } from '$lib/components/layout';
    import { ProductGridSection } from '$lib/components/sections';
    import {
        ProductGallery,
        ProductDetails,
        ProductInfoBlocks,
        ProductError
    } from '$lib/components/product';

    let { data } = $props();
    
    const variants = $derived(data?.variantRows ?? []);
    const productBase = $derived(data?.product);
	const otherProducts = $derived(data?.otherProducts ?? []);
    let selectedVariantId = $state<string | null>(null);
    let quantity = $state(1);
    let selectedImageUrl = $state<string | null>(null);
    const selectedVariant = $derived(
        variants.find((v) => v?.id === selectedVariantId) ?? variants[0] ?? null
    );

    $effect(() => {
        if (!selectedVariantId && variants.length > 0) {
            selectedVariantId = variants[0]?.id ?? null;
        }
    });

    function formatPrice(
        amount: number | string | null | undefined,
        currencyCode: string | null | undefined
    ): string {
        if (amount === null || amount === undefined) return '—';
        const parsed =
            typeof amount === 'number'
                ? amount
                : Number.parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
        if (!Number.isFinite(parsed)) return '—';
        const decimalAmount = parsed > 1000 ? parsed / 100 : parsed;
        const currency = currencyCode && currencyCode.trim() ? currencyCode : 'USD';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency
        }).format(decimalAmount);
    }

	const priceLabel = $derived(
        formatPrice(
            selectedVariant?.prices?.[0]?.amount ?? productBase?.variant?.price?.amount,
            selectedVariant?.prices?.[0]?.currency_code ?? productBase?.variant?.price?.currency_code
        )
    );
  
    const galleryImages = $derived([
        productBase?.thumbnail,
        ...variants.map((v) => v?.thumbnail ?? null)
    ].filter((url): url is string => !!url));
    const mainImage = $derived(
        selectedImageUrl ??
        variants.find((v) => v?.id === selectedVariantId)?.thumbnail ??
        productBase?.thumbnail ??
        galleryImages[0] ??
        null
    );
    const variantOptions = $derived(
        variants.map((v) => ({
            id: v?.id ?? '' as string,
            title: v?.title ?? '' as string,
            priceDisplay: formatPrice(
                v?.prices?.[0]?.amount ?? productBase?.variant?.price?.amount,
                v?.prices?.[0]?.currency_code ?? productBase?.variant?.price?.currency_code
            )
        }))
    );
    const accordionItems = [
        { key: 'details', title: 'PRODUCT DETAILS', content: '<p>Premium materials, designed for everyday wear.</p>' },
        { key: 'shipping', title: 'SHIPPING', content: '<p>Free standard shipping on all orders.</p>' }
    ];

</script>

<SiteHeader />
{#if data.error || variants.length === 0}
    <ProductError message={data.error ?? 'Product not found'} />
{:else}
    <main class="product-page">
        <div class="product-layout">
            <ProductGallery
                images={galleryImages}
                {mainImage}
                alt={productBase?.title ?? 'Product Image'}
                bind:selectedImageUrl
            />

            <ProductDetails
                title={productBase?.title ?? 'Loading...'}
                priceLabel={priceLabel ?? '—'}
                variants={variantOptions}
                bind:selectedVariantId
                bind:quantity
                {accordionItems}
                productHref={`/products/${productBase?.handle}`}
                productImage={mainImage}
                selectedVariantTitle={variants.find((v) => v?.id === selectedVariantId)?.title ?? ''}
            />
        </div>

        <ProductInfoBlocks />
        <section class="also-like">
            <h2 class="also-like-title">You May Also Like</h2>
            <ProductGridSection 
                products={otherProducts.map((v) => ({
                    name: v?.title ?? '',
                    bg: '#f4f4f4',
                    price: {
                        amount: parseFloat(v?.variant?.price?.amount ?? '0') / 100,
                        currency_code: v?.variant?.price?.currency_code ?? 'USD'
                    },
                    href: `/products/${productBase?.handle ?? ''}`,
                    image: v?.thumbnail ?? null,	
                }))} 
            />
        </section>
    </main>
{/if}
<SiteFooter  />
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
    .also-like { margin-top: 4rem; }
    .also-like-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
        text-align: center;
    }
    @media (max-width: 900px) {
        .product-layout { grid-template-columns: 1fr; }
    }
</style>
