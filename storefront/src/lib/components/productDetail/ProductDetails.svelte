<script lang="ts">
    import { addItemAndOpenSheet } from "$lib/cart/cart-state.svelte";
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
        variants: VariantItem[];
        selectedVariantId: string | null;
        quantity: number;
        accordionItems: AccordionItem[];
        productHref?: string;
        productId?: string | null;
        selectedVariantTitle: string;
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
        let unitPrice: string | null = null;
        if (selectedVariant) {
            const parsed = parseFloat(
                selectedVariant.priceDisplay.replace(/[^0-9.-]/g, ""),
            );
            unitPrice = Number.isFinite(parsed) ? String(parsed) : null;
        }

        const descRaw = (
            selectedVariantTitle ||
            selectedVariant?.title ||
            ""
        ).trim();
        await addItemAndOpenSheet({
            variantId,
            quantity: Math.max(1, quantity),

            title,
            description: descRaw || null,
            productId,
            unitPrice,
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
