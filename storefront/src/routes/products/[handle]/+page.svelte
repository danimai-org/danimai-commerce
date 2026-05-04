<script lang="ts">
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import ProductDetails from "$lib/components/productDetail/ProductDetails.svelte";
    import ProductError from "$lib/components/productDetail/ProductError.svelte";
    import ProductGallery from "$lib/components/productDetail/ProductGallery.svelte";
    import ProductInfoBlocks from "$lib/components/productDetail/ProductInfoBlocks.svelte";

    import { ProductGridSection } from "$lib/components/sections";

    import { formatStoreMoney } from "$lib/money";

    let { data } = $props();
    const product = $derived(data?.product);
    const variants = $derived(data?.variantRows ?? []);
    const otherProducts = $derived(data?.otherProducts ?? []);
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
    function formatPrice(
        amount: number | string | null | undefined,
        _currencyCode: string | null | undefined,
    ): string {
        if (amount === null || amount === undefined) return "—";
        const parsed =
            typeof amount === "number"
                ? amount
                : Number.parseFloat(String(amount).replace(/[^0-9.-]/g, ""));
        if (!Number.isFinite(parsed)) return "—";
        const decimalAmount = parsed > 1000 ? parsed / 100 : parsed;
        return formatStoreMoney(decimalAmount);
    }

    const priceLabel = $derived(
        formatPrice(
            product?.variant?.price?.amount ?? product?.variant?.price?.amount,
            product?.variant?.price?.currency_code ??
                product?.variant?.price?.currency_code,
        ),
    );

    const galleryImages = $derived(
        [
            product?.thumbnail,
            ...variants.map((v) => v?.thumbnail ?? null),
        ].filter((url): url is string => !!url),
    );
    const variantOptions = $derived(
        variants.map((v) => ({
            id: v?.id ?? ("" as string),
            title: v?.title ?? ("" as string),
            priceDisplay: formatPrice(
                v?.prices?.[0]?.amount ?? product?.variant?.price?.amount,
                v?.prices?.[0]?.currency_code ??
                    product?.variant?.price?.currency_code,
            ),
        })),
    );

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
            <ProductGallery images={galleryImages} bind:selectedImageIndex />

            <ProductDetails
                title={product?.title ?? "Loading..."}
                priceLabel={priceLabel ?? "—"}
                variants={variantOptions}
                bind:selectedVariantId
                bind:quantity
                {accordionItems}
                productHref={`/products/${product?.handle}`}
                productId={product?.id ?? null}
                selectedVariantTitle={variants.find(
                    (v) => v?.id === resolvedVariantId,
                )?.title ?? ""}
            />
        </div>

        <ProductInfoBlocks />
        <section class="also-like">
            <h2 class="also-like-title">You May Also Like</h2>
            <ProductGridSection
                products={otherProducts.map((v) => ({
                    name: v?.title ?? "",
                    bg: "#f4f4f4",
                    price: {
                        amount:
                            parseFloat(v?.variant?.price?.amount ?? "0") / 100,
                        currency_code:
                            v?.variant?.price?.currency_code ?? "EUR",
                    },
                    href: `/products/${v?.handle ?? ""}`,
                    image: v?.thumbnail ?? null,
                    variantId: v?.variant?.id ?? null,
                }))}
                title=""
                subtitle=""
            />
        </section>
    </main>
{/if}
<SiteFooter />

<style>
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
        margin-bottom: 1.5rem;
        text-align: center;
    }
    @media (max-width: 900px) {
        .product-layout {
            grid-template-columns: 1fr;
        }
    }
</style>
