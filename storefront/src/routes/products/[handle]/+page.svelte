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
    const product = $derived(data?.product);
    const variants = $derived(data?.variantRows ?? []);
    const otherProducts = $derived(data?.otherProducts ?? []);
    let selectedVariantId = $state<string | null>(null);
    let quantity = $state(1);
    let selectedImageUrl = $state<string | null>(null);
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
            product?.variant?.price?.amount ?? product?.variant?.price?.amount,
            product?.variant?.price?.currency_code ?? product?.variant?.price?.currency_code
        )
    );
  
    const galleryImages = $derived([
        product?.thumbnail,
        ...variants.map((v) => v?.thumbnail ?? null)
    ].filter((url): url is string => !!url));
    const mainImage = $derived(
        selectedImageUrl ??
        variants.find((v) => v?.id === selectedVariantId)?.thumbnail ??
        product?.thumbnail ??
        galleryImages[0] ??
        null
    );
    const variantOptions = $derived(
        variants.map((v) => ({
            id: v?.id ?? '' as string,
            title: v?.title ?? '' as string,
            priceDisplay: formatPrice(
                v?.prices?.[0]?.amount ?? product?.variant?.price?.amount,
                v?.prices?.[0]?.currency_code ?? product?.variant?.price?.currency_code
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
                alt={product?.title ?? 'Product Image'}
                bind:selectedImageUrl
            />

            <ProductDetails
                title={product?.title ?? 'Loading...'}
                priceLabel={priceLabel ?? '—'}
                variants={variantOptions}
                bind:selectedVariantId
                bind:quantity
                {accordionItems}
                productHref={`/products/${product?.handle}`}
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
                        currency_code: v?.variant?.price?.currency_code ?? 'AUD'
                    },
                    href: `/products/${v?.handle ?? ''}`,
                    image: v?.thumbnail ?? null,	
                }))} title="" subtitle="" />
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
