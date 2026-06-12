<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import { client } from "$lib/api/client.js";
    import {
        CartLineItems,
        CartOrderSummary,
        CartCompleteLook,
    } from "$lib/components/cart";
    import { createQuery } from "@tanstack/svelte-query";
    import {
        addItem,
        cartState,
        changeLineItemQuantity,
        getCartPagePath,
        initCartState,
        removeLineItem,
        resolveUnitPriceForAdd,
    } from "$lib/cart/cart-state.svelte";
    import { formatForCurrency } from "$lib/money";
    import {
        formatVariantPrice,
        resolveVariantPrice,
        type VariantPrice,
    } from "$lib/pricing";
    import {
        getSelectedCurrencyCode,
        regionState,
    } from "$lib/region/region-state.svelte";
    import {
        fetchVariantDisplayMap,
        variantDisplayLabel,
        type VariantDisplayRow,
    } from "$lib/cart/variant-display-map";
    import type { CartRowView } from "$lib/types/cart-view";
    import type { StorefrontProductListRow } from "$lib/types/product";

    let {} = $props();

    const listQuery = { page: "1", limit: "100" } as const;
    const productsQuery = createQuery(() => ({
        queryKey: ["storefront-products", listQuery.page, listQuery.limit],
        queryFn: () => client.storefront.products.get({ query: listQuery }),
    }));

    const products = $derived.by((): StorefrontProductListRow[] => {
        const root = productsQuery.data;
        if (root?.error || !root?.data) return [];
        return root.data.rows ?? [];
    });

    type LookExtra = { image: string | null; priceDisplay: string };
    let lookExtrasByProductId = $state(new Map<string, LookExtra>());
    const handleByProductId = $derived.by(() => {
        const m = new Map<string, string>();
        for (const p of products) m.set(p.id, p.handle);
        return m;
    });
    const thumbnailByProductId = $derived.by(() => {
        const m = new Map<string, string | null>();
        for (const p of products) m.set(p.id, p.thumbnail ?? null);
        return m;
    });

    let variantDetailsById = $state(new Map<string, VariantDisplayRow>());

    const currencyCode = $derived.by(() => {
        void regionState.selectedRegionId;
        return getSelectedCurrencyCode();
    });

    const routeCartId = $derived(page.params.id ?? "");

    $effect(() => {
        const id = routeCartId;
        if (!id) return;
        void (async () => {
            const cart = await initCartState(false, id);
            const resolvedId = cart?.id;
            if (resolvedId && resolvedId !== id) {
                goto(getCartPagePath(resolvedId), { replaceState: true });
            }
        })();
    });

    $effect(() => {
        const lineItems = cartState.cart?.line_items;
        if (!lineItems?.length) {
            variantDetailsById = new Map();
            return;
        }
        let cancelled = false;
        const code = currencyCode;
        void (async () => {
            const next = await fetchVariantDisplayMap(lineItems, code);
            if (!cancelled) variantDetailsById = next;
        })();
        return () => {
            cancelled = true;
        };
    });

    const cartPending = $derived(cartState.loading && cartState.cart === null);
    const cartFailed = $derived(Boolean(cartState.error));
    const cartItems = $derived.by((): CartRowView[] => {
        const cart = cartState.cart;
        const map = handleByProductId;
        const thumbs = thumbnailByProductId;
        const vmap = variantDetailsById;
        const code = currencyCode;
        if (!cart?.line_items?.length) return [];
        return cart.line_items.map((li) => {
            const handle = li.product_id ? map.get(li.product_id) : undefined;
            const href = handle ? `/products/${handle}` : "/";
            const qty = li.quantity ?? 0;
            const nestedVariant = li as unknown as {
                variant?: { title?: string | null } | null;
            };
            const vd = li.variant_id ? vmap.get(li.variant_id) : undefined;
            const pv = parsePrice(li.unit_price ?? vd?.unitPrice ?? "0");
            const productThumb = li.product_id
                ? (thumbs.get(li.product_id) ?? null)
                : null;
            const variantLabel =
                (nestedVariant.variant?.title &&
                    String(nestedVariant.variant.title).trim()) ||
                variantDisplayLabel(vd) ||
                (li.description && String(li.description).trim()) ||
                "";
            return {
                key: `api:${li.id}`,
                lineId: li.id,
                source: "api",
                href,
                name: li.title ?? "Item",
                priceDisplay: formatForCurrency(pv, code),
                priceValue: pv,
                image: li.thumbnail ?? vd?.thumbnail ?? productThumb,
                quantity: qty,
                variant: variantLabel || (li.variant_id ? "" : "—"),
            };
        });
    });
    const displayItems = $derived(cartItems);
    const subtotal = $derived(
        displayItems.reduce(
            (sum: number, i: CartRowView) => sum + i.priceValue * i.quantity,
            0,
        ),
    );
    const taxDisplay = $derived("—");

    let promoOpen = $state(false);
    let promoInput = $state("");
    function openPromo() {
        promoOpen = true;
    }

    function closePromo() {
        promoOpen = false;
        promoInput = "";
    }

    function applyPromo() {
        if (promoInput.trim()) {
        }
    }

    function parsePrice(priceStr: string | number | null | undefined): number {
        if (typeof priceStr === "number") {
            return Number.isFinite(priceStr) ? priceStr : 0;
        }
        if (priceStr == null) return 0;
        const raw = String(priceStr).trim();
        if (!raw) return 0;
        const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
        if (!Number.isFinite(n)) return 0;
        if (!raw.includes(".") && n > 1000) return n / 100;
        return Number.isFinite(n) ? n : 0;
    }

    $effect(() => {
        const slice = products.slice(0, 4);
        void regionState.selectedRegionId;
        const code = getSelectedCurrencyCode();
        if (slice.length === 0) {
            lookExtrasByProductId = new Map();
            return;
        }
        const next = new Map<string, LookExtra>();
        for (const p of slice) {
            const prices = (p.variant?.prices ?? []) as VariantPrice[];
            const resolved =
                resolveVariantPrice(prices, code) ??
                (p.variant?.price?.amount && p.variant?.price?.currency_code
                    ? {
                          amount: p.variant.price.amount,
                          currency_code: p.variant.price.currency_code,
                      }
                    : null);
            next.set(p.id, {
                image: p.variant?.thumbnail ?? p.thumbnail ?? null,
                priceDisplay: formatVariantPrice(resolved),
            });
        }
        lookExtrasByProductId = next;
    });

    async function changeLineQuantity(lineId: string, delta: number) {
        const item = cartState.cart?.line_items.find((li) => li.id === lineId);
        if (!item) return;
        const current = Math.max(1, item.quantity ?? 1);
        if (delta < 0 && current <= 1) return;
        await changeLineItemQuantity(lineId, current + delta);
    }

    async function removeLine(lineId: string) {
        if (!confirm("Remove this item from your cart?")) return;
        await removeLineItem(lineId);
    }

    async function quickAdd(
        e: MouseEvent,
        product: { id: string; title: string; handle: string },
    ) {
        e.preventDefault();
        e.stopPropagation();
        const row = products.find((p) => p.id === product.id);
        const variant = row?.variant;
        if (!variant?.id) return;
        const unitPrice =
            resolveUnitPriceForAdd(
                (variant.prices ?? []) as VariantPrice[],
            ) ?? "0";
        const fallbackThumb = thumbnailByProductId.get(product.id) ?? null;
        await addItem({
            variantId: variant.id,
            productId: product.id,
            title: product.title,
            description: variant.title?.trim() || null,
            unitPrice,
            thumbnail: variant.thumbnail ?? fallbackThumb,
            quantity: 1,
        });
    }
</script>

<SiteHeader />

<main class="cart-page">
    <div class="cart-container">
        <div class="cart-main">
            <header class="cart-header">
                <h1 class="cart-title">Shopping Cart</h1>
                <a href="/" class="continue-shopping">Continue shopping</a>
            </header>

            {#if cartPending}
                <p class="cart-status">Loading cart…</p>
            {:else if cartFailed}
                <div class="cart-empty">
                    <p>Could not load your cart.</p>
                    <a href="/" class="continue-shopping-btn"
                        >Continue shopping</a
                    >
                </div>
            {:else if displayItems.length === 0}
                <div class="cart-empty">
                    <p>Your cart is empty.</p>
                    <a href="/" class="continue-shopping-btn"
                        >Continue shopping</a
                    >
                </div>
            {:else}
                <CartLineItems
                    items={displayItems}
                    onChangeQuantity={(lineId, delta) =>
                        void changeLineQuantity(lineId, delta)}
                    onRemove={(lineId) => void removeLine(lineId)}
                />

                <section class="order-notes">
                    <h2 class="order-notes-title">ORDER NOTES (OPTIONAL)</h2>
                    <textarea
                        class="order-notes-input"
                        placeholder="Special instructions for your order..."
                        rows="4"
                    ></textarea>
                    <p class="order-notes-desc">
                        Add any special requests or delivery instructions
                    </p>
                </section>
            {/if}
        </div>

        {#if !cartPending && !cartFailed && displayItems.length > 0}
            <CartOrderSummary
                {subtotal}
                shipping={0}
                discount={0}
                {taxDisplay}
                total={subtotal}
                {promoOpen}
                bind:promoInput
                onOpenPromo={openPromo}
                onApplyPromo={applyPromo}
                onClosePromo={closePromo}
            />
        {/if}
    </div>

    {#if products.length > 0}
        <CartCompleteLook
            {products}
            {lookExtrasByProductId}
            onQuickAdd={(e, product) => void quickAdd(e, product)}
        />
    {/if}
</main>

<SiteFooter />

<style>
    .cart-page {
        background: #f5f5f5;
        min-height: 100vh;
        padding-bottom: 2rem;
    }
    .cart-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 3rem;
        align-items: start;
    }
    .cart-main {
        background: #fff;
        border-radius: 8px;
        padding: 2rem;
    }
    .cart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    .cart-title {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
        color: #1a1a1a;
        letter-spacing: -0.02em;
    }
    .continue-shopping {
        font-size: 0.9375rem;
        color: #555;
        text-decoration: none;
    }
    .continue-shopping:hover {
        color: #1a1a1a;
        text-decoration: underline;
    }
    .cart-status {
        margin: 0;
        padding: 2rem 0;
        text-align: center;
        color: #666;
        font-size: 1rem;
    }
    .cart-empty {
        text-align: center;
        padding: 3rem 2rem;
        color: #666;
    }
    .cart-empty p {
        margin: 0 0 1rem;
        font-size: 1rem;
    }
    .continue-shopping-btn {
        display: inline-block;
        background: #2d2d2d;
        color: #fff;
        padding: 0.75rem 1.5rem;
        text-decoration: none;
        font-size: 0.9375rem;
        font-weight: 500;
        border-radius: 6px;
    }
    .continue-shopping-btn:hover {
        background: #1a1a1a;
    }
    .order-notes {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #eee;
    }
    .order-notes-title {
        font-size: 0.6875rem;
        letter-spacing: 0.1em;
        color: #666;
        margin: 0 0 0.75rem;
        font-weight: 600;
    }
    .order-notes-input {
        width: 100%;
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.9375rem;
        font-family: inherit;
        resize: vertical;
        box-sizing: border-box;
    }
    .order-notes-input::placeholder {
        color: #999;
    }
    .order-notes-desc {
        font-size: 0.8125rem;
        color: #888;
        margin: 0.5rem 0 0;
    }
    @media (max-width: 1024px) {
        .cart-container {
            grid-template-columns: 1fr;
        }
    }
</style>
