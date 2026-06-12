<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        addItemAndOpenSheet,
        resolveUnitPriceForAdd,
    } from "$lib/cart/cart-state.svelte";
    import { formatForCurrency } from "$lib/money";
    import { formatVariantPrice, resolveVariantPrice } from "$lib/pricing";
    import {
        getSelectedCurrencyCode,
        regionState,
    } from "$lib/region/region-state.svelte";
    import { resolveGridItemPrice } from "$lib/types/product-grid";
    import { AddToCart, CartImage, CartTitle } from "../productCart";
    import type { ProductGridItem } from "$lib/types/product-grid";

    const { product } = $props<{ product: ProductGridItem }>();

    const regionalPrice = $derived.by(() => {
        void regionState.selectedRegionId;
        return resolveGridItemPrice(product);
    });

    const priceDisplay = $derived.by(() => {
        void regionState.selectedRegionId;
        const resolved = resolveVariantPrice(
            product.prices,
            getSelectedCurrencyCode(),
        );
        if (resolved) return formatVariantPrice(resolved);
        const amount = regionalPrice.amount;
        if (!Number.isFinite(amount)) return "—";
        return formatForCurrency(amount, regionalPrice.currency_code);
    });

    function resolveVariantTitle(product: ProductGridItem): string | null {
        const candidates = [
            product.variantTitle,
            product.variant?.title,
            (product.variants?.[0] as { title?: string | null } | undefined)
                ?.title,
        ];
        for (const c of candidates) {
            if (typeof c === "string" && c.trim().length > 0) {
                return c.trim();
            }
        }
        return null;
    }

    async function quickAdd(e: MouseEvent, product: ProductGridItem) {
        e.preventDefault();
        e.stopPropagation();
        const variantId = resolveVariantId(product);
        if (!variantId) return;
        const unitPrice = resolveUnitPriceForAdd(
            product.prices,
            regionalPrice.amount,
        );
        await addItemAndOpenSheet({
            variantId,
            quantity: 1,
            thumbnail: product.image ?? null,
            title: product.name ?? null,
            description: resolveVariantTitle(product),
            unitPrice,
        });
    }

    function handleCardKeydown(e: KeyboardEvent, href: string) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        openProduct(href);
    }

    function resolveVariantId(product: ProductGridItem): string | null {
        const directCandidates = [
            product.variantId,
            product.variant_id,
            product.variant?.id,
            product.variants?.[0]?.id,
            (product.variants?.[0] as Record<string, unknown> | undefined)
                ?.variant_id,
        ];
        for (const candidate of directCandidates) {
            if (isUsableVariantId(candidate)) {
                return candidate;
            }
        }

        const queue: unknown[] = [product];
        const visited = new Set<unknown>();
        while (queue.length > 0) {
            const current = queue.shift();
            if (!current || typeof current !== "object") continue;
            if (visited.has(current)) continue;
            visited.add(current);

            if (Array.isArray(current)) {
                for (const item of current) queue.push(item);
                continue;
            }

            const obj = current as Record<string, unknown>;
            const keys = ["variantId", "variant_id", "variantID", "variant-id"];
            for (const key of keys) {
                const value = obj[key];
                if (isUsableVariantId(value)) return value;
            }
            for (const value of Object.values(obj)) {
                queue.push(value);
            }
        }
        return null;
    }

    function isUsableVariantId(value: unknown): value is string {
        if (typeof value !== "string") return false;
        return value.trim().length > 0;
    }

    function openProduct(href: string) {
        if (!href) return;
        void goto(href);
    }

    function handleSurfaceClick(e: MouseEvent, href: string) {
        if (e.defaultPrevented) return;
        const target = e.target as HTMLElement | null;
        if (!target) return;
        if (
            target.closest("button, input, select, textarea, [role='button']")
        ) {
            return;
        }
        openProduct(href);
    }
</script>

<article class="product-card retail-card">
    <div
        class="retail-card-surface"
        role="link"
        tabindex="0"
        onclick={(e) => handleSurfaceClick(e, product.href)}
        onkeydown={(e) => handleCardKeydown(e, product.href)}
    >
        <a href={product.href} class="retail-card-link">
            <CartImage
                image={product.image}
                title={product.name}
                bg={product.bg}
            />

            <div class="retail-body">
                <div class="retail-title-colume">
                    <CartTitle title={product.name} priceDisplay={priceDisplay} />
                </div>
            </div>
        </a>
        <AddToCart handleAddToCart={(e) => quickAdd(e, product)} />
    </div>
</article>
