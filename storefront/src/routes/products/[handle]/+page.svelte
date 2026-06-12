<script lang="ts">
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import ProductDetails from "$lib/components/productDetail/ProductDetails.svelte";
    import ProductError from "$lib/components/productDetail/ProductError.svelte";
    import ProductGallery from "$lib/components/productDetail/ProductGallery.svelte";
    import ProductInfoBlocks from "$lib/components/productDetail/ProductInfoBlocks.svelte";

    import ProductGridSection from "$lib/components/ProductGridSection.svelte";

    import {
        formatVariantPrice,
        resolveVariantPrice,
        type VariantPrice,
    } from "$lib/pricing";
    import {
        getSelectedCurrencyCode,
        regionState,
    } from "$lib/region/region-state.svelte";
    import { toProductGridItem } from "$lib/types/product-grid";
    import type { ProductPageData } from "./+page.js";

    let { data }: { data: ProductPageData } = $props();
    const product = $derived(data.product);
    const variants = $derived(data.variantRows ?? []);
    const otherProducts = $derived(data.otherProducts ?? []);
    let selectedVariantId = $state<string | null>(null);
    let quantity = $state(1);
    let selectedImageIndex = $state<number>(0);

    const defaultVariantId = $derived.by(() => {
        const fromProduct = product?.variant?.id;
        if (fromProduct && variants.some((v) => v?.id === fromProduct)) {
            return fromProduct;
        }
        return variants[0]?.id ?? null;
    });

    const resolvedVariantId = $derived(selectedVariantId ?? defaultVariantId);

    $effect(() => {
        if (variants.length === 0 || !defaultVariantId) return;
        const ids = new Set(
            variants
                .map((v) => v?.id)
                .filter((id): id is string => Boolean(id)),
        );
        if (!selectedVariantId || !ids.has(selectedVariantId)) {
            selectedVariantId = defaultVariantId;
        }
    });

    function formatRegionalPrice(
        prices: VariantPrice[] | undefined,
        fallback?: { amount?: string; currency_code?: string } | null,
    ): string {
        void regionState.selectedRegionId;
        const currencyCode = getSelectedCurrencyCode();
        const resolved =
            resolveVariantPrice(prices, currencyCode) ??
            (fallback?.amount && fallback.currency_code
                ? {
                      amount: fallback.amount,
                      currency_code: fallback.currency_code,
                  }
                : null);
        return formatVariantPrice(resolved);
    }

    const selectedVariant = $derived(
        variants.find((v) => v?.id === resolvedVariantId) ?? null,
    );

    const priceLabel = $derived(
        formatRegionalPrice(
            selectedVariant?.prices as VariantPrice[] | undefined,
            selectedVariant?.prices?.[0] ?? product?.variant?.price,
        ),
    );

    const galleryImages = $derived.by(() => {
        const media = product?.media ?? [];
        const fromMedia = [...media]
            .sort((a, b) => (a?.rank ?? 0) - (b?.rank ?? 0))
            .map((item) => item?.url?.trim?.() ?? "")
            .filter((url): url is string => url.length > 0);
        if (fromMedia.length > 0) return fromMedia;
        const thumb = product?.thumbnail?.trim?.() ?? "";
        return thumb ? [thumb] : [];
    });

    $effect(() => {
        const images = galleryImages;
        const thumb = selectedVariant?.thumbnail?.trim?.() ?? "";
        if (!thumb || images.length === 0) return;
        const index = images.indexOf(thumb);
        if (index >= 0) {
            selectedImageIndex = index;
        }
    });
    const variantOptions = $derived(
        variants.map((v) => {
            const row = v as {
                id?: string;
                title?: string;
                sku?: string | null;
                thumbnail?: string | null;
                options?: Array<{ title?: string; value?: string }>;
                prices?: Array<{ amount?: string; currency_code?: string }>;
            };
            return {
                id: row?.id ?? "",
                title: row?.title ?? "",
                sku: row?.sku ?? null,
                thumbnail: row?.thumbnail ?? product?.thumbnail ?? null,
                optionValues: (row?.options ?? [])
                    .map((opt) => ({
                        title: String(opt?.title ?? ""),
                        value: String(opt?.value ?? ""),
                    }))
                    .filter((opt) => opt.title || opt.value),
                priceDisplay: formatRegionalPrice(
                    row?.prices as VariantPrice[] | undefined,
                    row?.prices?.[0] ?? product?.variant?.price,
                ),
                prices: row?.prices ?? [],
            };
        }),
    );
    const relatedProducts = $derived.by(() => {
        void regionState.selectedRegionId;
        return otherProducts.map((row, index) =>
            toProductGridItem(row, index, { preferProductThumbnail: true }),
        );
    });
    const accordionItems = [
        {
            key: "details",
            title: "PRODUCT DETAILS",
            content: "<p>Premium materials, designed for everyday wear.</p>",
        },
        {
            key: "shipping",
            title: "SHIPPING",
            content: "<p>Free standard shipping on all orders.</p>",
        },
    ];
</script>

<SiteHeader />
{#if data.error || variants.length === 0}
    <ProductError message={data.error ?? "Product not found"} />
{:else}
    <main class="product-page">
        <div class="product-layout">
            <ProductGallery
                images={galleryImages}
                bind:selectedImageIndex
                alt={product?.title ?? "Product"}
            />

            <ProductDetails
                title={product?.title ?? "Loading..."}
                priceLabel={priceLabel ?? "—"}
                variants={variantOptions}
                bind:selectedVariantId
                bind:quantity
                {accordionItems}
                productHref={`/products/${product?.handle}`}
                productId={product?.id ?? null}
                productThumbnail={product?.thumbnail ?? null}
                productHandle={product?.handle ?? null}
                selectedVariantTitle={variants.find(
                    (v) => v?.id === resolvedVariantId,
                )?.title ?? ""}
            />
        </div>

        <ProductInfoBlocks />
        <section class="also-like">
            <h2 class="also-like-title">You May Also Like</h2>
            <ProductGridSection
                products={relatedProducts}
                title=""
                subtitle=""
            />
        </section>
    </main>
{/if}
<SiteFooter />
