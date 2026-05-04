<script lang="ts">
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
        initCartState,
        removeLineItem,
    } from "$lib/cart/cart-state.svelte";
    import {
        API_BASE,
        firstVariantIdByProductIds,
        rowsFromPaginated,
    } from "$lib/api/storefront-api";
    import {
        fetchVariantDisplayMap,
        variantDisplayLabel,
        type VariantDisplayRow,
    } from "$lib/cart/variant-display-map";

    type CartRowView = {
        key: string;
        lineId: string;
        source: "api" | "local";
        href: string;
        name: string;
        priceDisplay: string;
        priceValue: number;
        image: string | null;
        quantity: number;
        variant: string;
    };

    let {} = $props();

    const listQuery = { page: 1, limit: 100 } as const;
    const productsQuery = createQuery(() => ({
        queryKey: ["products", listQuery.page, listQuery.limit],
        queryFn: () => client.admin["products"].get({ query: listQuery }),
    }));

    type ProductRow = {
        id: string;
        title: string;
        handle: string;
        thumbnail?: string | null;
    };
    const products = $derived.by((): ProductRow[] => {
        const root = productsQuery.data as unknown;
        const direct = (
            root as { data?: { rows?: ProductRow[] } } | null | undefined
        )?.data?.rows;
        if (Array.isArray(direct) && direct.length > 0)
            return direct as ProductRow[];
        const qd = root as { data?: unknown } | null | undefined;
        const raw = qd?.data;
        if (raw == null) return [];
        let { rows } = rowsFromPaginated<ProductRow>(raw);
        if (
            rows.length === 0 &&
            raw &&
            typeof raw === "object" &&
            "data" in raw
        ) {
            rows = rowsFromPaginated<ProductRow>(
                (raw as { data: unknown }).data,
            ).rows;
        }
        return rows;
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

    $effect(() => {
        void initCartState();
    });

    $effect(() => {
        const lineItems = cartState.cart?.line_items;
        if (!lineItems?.length) {
            variantDetailsById = new Map();
            return;
        }
        let cancelled = false;
        void (async () => {
            const next = await fetchVariantDisplayMap(lineItems);
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
                priceDisplay: `$${pv.toFixed(2)}`,
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

    function treatyErrorMessage(err: unknown): string {
        const o = err as { value?: { message?: string } };
        return o?.value?.message ?? String(err);
    }

    async function firstVariantIdByProductId(
        productId: string,
    ): Promise<string | null> {
        const res = await client.admin["product-variants"].get({
            query: { page: 1, limit: 1, filters: { product_id: productId } },
        });
        if (res.error) throw new Error(treatyErrorMessage(res.error));
        const rows =
            (res.data as { rows?: Array<{ id?: string | null }> })?.rows ?? [];
        return rows[0]?.id ?? null;
    }

    async function fetchVariantLineMeta(variantId: string): Promise<{
        title: string;
        thumbnail: string | null;
        unitPrice: string;
    } | null> {
        const res = await client.admin["product-variants"]({
            id: variantId,
        }).get();
        if (res.error || !res.data) return null;
        const d = res.data as {
            title: string;
            thumbnail?: string | null;
            prices?: Array<{ amount: string }>;
        };
        const raw = d.prices?.[0]?.amount;
        let unitPrice = "0";
        if (raw != null && raw !== "") {
            const cents = parseInt(raw, 10);
            unitPrice = Number.isFinite(cents) ? String(cents / 100) : "0";
        }
        return {
            title: d.title,
            thumbnail: d.thumbnail ?? null,
            unitPrice,
        };
    }

    $effect(() => {
        const slice = products.slice(0, 4);
        if (slice.length === 0) {
            lookExtrasByProductId = new Map();
            return;
        }
        let cancelled = false;
        void (async () => {
            try {
                const variantByProduct = await firstVariantIdByProductIds(
                    API_BASE,
                    slice.map((p) => p.id),
                );
                const next = new Map<string, LookExtra>();
                await Promise.all(
                    slice.map(async (p) => {
                        const vid = variantByProduct.get(p.id);
                        if (!vid) {
                            next.set(p.id, {
                                image: p.thumbnail ?? null,
                                priceDisplay: "—",
                            });
                            return;
                        }
                        const meta = await fetchVariantLineMeta(vid);
                        const up =
                            meta?.unitPrice != null
                                ? parseFloat(meta.unitPrice)
                                : Number.NaN;
                        next.set(p.id, {
                            image: meta?.thumbnail ?? p.thumbnail ?? null,
                            priceDisplay: Number.isFinite(up)
                                ? `$${up.toFixed(2)}`
                                : "—",
                        });
                    }),
                );
                if (!cancelled) lookExtrasByProductId = next;
            } catch {
                if (!cancelled) lookExtrasByProductId = new Map();
            }
        })();
        return () => {
            cancelled = true;
        };
    });

    async function changeLineQuantity(lineId: string, delta: number) {
        const item = cartState.cart?.line_items.find((li) => li.id === lineId);
        if (!item) return;
        await changeLineItemQuantity(lineId, (item.quantity ?? 0) + delta);
    }

    async function removeLine(lineId: string) {
        await removeLineItem(lineId);
    }

    async function quickAdd(
        e: MouseEvent,
        product: { id: string; title: string; handle: string },
    ) {
        e.preventDefault();
        e.stopPropagation();
        const variant_id = await firstVariantIdByProductId(product.id);
        if (!variant_id) return;
        const meta = await fetchVariantLineMeta(variant_id);
        const fallbackThumb = thumbnailByProductId.get(product.id) ?? null;
        await addItem({
            variantId: variant_id,
            productId: product.id,
            title: product.title,
            description: meta?.title?.trim() || null,
            unitPrice: meta?.unitPrice ?? "0",
            thumbnail: meta?.thumbnail ?? fallbackThumb,
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
