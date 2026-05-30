<script lang="ts">
    import { goto } from "$app/navigation";
    import { addItemAndOpenSheet } from "$lib/cart/cart-state.svelte";
    import { formatStoreMoney } from "$lib/money";
    import { AddToCart, CartImage, CartTitle } from "../productCart";
    import type { ProductGridItem } from "$lib/types/product-grid";

    const { product } = $props<{ product: ProductGridItem }>();

    function parsePrice(price: string | number | null | undefined): number {
        if (typeof price === "number") {
            return Number.isFinite(price) ? price : 0;
        }
        if (typeof price === "string") {
            const trimmed = price.trim();
            if (!trimmed || trimmed === "—") {
                return 0;
            }
            const n = parseFloat(trimmed.replace(/[^0-9.]/g, ""));
            return Number.isFinite(n) ? n : 0;
        }
        return 0;
    }

    function displayPrice(
        price: string | number | null | undefined,
        _currencyCode: string | null | undefined,
    ): string {
        if (typeof price === "string") {
            const trimmed = price.trim();
            if (!trimmed || trimmed === "—") {
                return "—";
            }
            if (/^[^\d\s-]/.test(trimmed)) {
                return trimmed;
            }
            const parsed = parsePrice(trimmed);
            if (!Number.isFinite(parsed)) return "—";
            return formatStoreMoney(parsed);
        }
        if (typeof price === "number") {
            if (!Number.isFinite(price)) return "—";
            return formatStoreMoney(price);
        }
        return "—";
    }

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
        const amount = product.price?.amount;
        const unitPrice =
            typeof amount === "number" && Number.isFinite(amount)
                ? String(amount)
                : null;
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
                    <CartTitle
                        title={product.name}
                        priceDisplay={displayPrice(
                            product.price.amount,
                            product.price.currency_code,
                        )}
                    />
                </div>
            </div>
        </a>
        <AddToCart handleAddToCart={(e) => quickAdd(e, product)} />
    </div>
</article>
