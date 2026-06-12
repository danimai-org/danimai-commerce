<script lang="ts">
    import {
        addItemAndOpenSheet,
        resolveUnitPriceForAdd,
    } from "$lib/cart/cart-state.svelte";
    import ProductVariantSelect from "./ProductVariantSelect.svelte";
    import ProductQuantity from "./ProductQuantity.svelte";
    import ProductAccordions from "./ProductAccordions.svelte";
    import type { VariantItem } from "./ProductVariantSelect.svelte";
    import type { AccordionItem } from "./ProductAccordions.svelte";
    import AddToCart from "../productCart/AddToCart.svelte";

    type ProductDetailsProps = {
        title: string;
        priceLabel: string;
        tagline?: string;
        variants: Array<VariantItem & { thumbnail?: string | null }>;
        selectedVariantId: string | null;
        quantity: number;
        accordionItems: AccordionItem[];
        productHref?: string;
        productId?: string | null;
        selectedVariantTitle: string;
        productThumbnail?: string | null;
        productHandle?: string | null;
    };
    let {
        title = "",
        priceLabel = "—",
        tagline = "",
        variants = [],
        selectedVariantId = $bindable(null as string | null),
        quantity = $bindable(1),
        accordionItems = [],
        productHref = "",
        productId = null as string | null,
        selectedVariantTitle = "",
        productThumbnail = null,
        productHandle = null,
    }: ProductDetailsProps = $props();

    async function addToCart() {
        const variantId = selectedVariantId ?? variants[0]?.id ?? null;
        if (!variantId) return;
        if (!selectedVariantId) {
            selectedVariantId = variantId;
        }

        const selectedVariant = variants.find(
            (variant) => variant.id === variantId,
        );
        const unitPrice = resolveUnitPriceForAdd(
            (selectedVariant as { prices?: Array<{ amount?: string; currency_code?: string }> })
                ?.prices,
        );

        const descRaw = (
            selectedVariantTitle ||
            selectedVariant?.title ||
            ""
        ).trim();
        await addItemAndOpenSheet({
            variantId,
            quantity: Math.max(1, quantity),
            thumbnail: selectedVariant?.thumbnail ?? productThumbnail ?? null,
            title,
            description: descRaw || null,
            productId,
            unitPrice,
            sku: selectedVariant?.sku ?? null,
            variantTitle: descRaw || null,
            optionValues: selectedVariant?.optionValues ?? null,
            productHandle: productHandle ?? undefined,
        });
    }
</script>

<div class="product-details">
    <h1 class="product-title">{title}</h1>
    <p class="product-price">{priceLabel}</p>

    <ProductVariantSelect {variants} bind:selectedVariantId />

    <ProductQuantity bind:quantity />
    <AddToCart handleAddToCart={() => addToCart()} />

    {#if tagline}
        <p class="product-tagline">{tagline}</p>
    {/if}

    {#if accordionItems.length > 0}
        <ProductAccordions items={accordionItems} defaultOpenKey="shipping" />
    {/if}

    <button type="button" class="share-link">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
            ><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline
                points="16 6 12 2 8 6"
            /><line x1="12" y1="2" x2="12" y2="15" /></svg
        >
        Share Product
    </button>
</div>
