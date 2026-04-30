<script lang="ts">
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import { client } from "$lib/api/client.js";
    import {
        CartLineItems,
        CartOrderSummary,
        CartCompleteLook,
    } from "$lib/components/cart";
    import { createQuery, useQueryClient } from "@tanstack/svelte-query";
    import {
        API_BASE,
        firstVariantIdByProductIds,
        rowsFromPaginated,
    } from "$lib/api/storefront-api";

    const SESSION_STORAGE_KEY = "dm_sf_session_id";
    const CART_STORAGE_KEY = "dm_sf_cart_id";
    const DEFAULT_CART_CURRENCY_CODE = "usd";

    const shippingDisplay = $state("$0.00");
    const discountDisplay = $state("$0.00");
    const taxDisplay = $state("$0.00");

    type ApiLineItem = {
        id: string;
        title: string | null;
        description: string | null;
        thumbnail: string | null;
        variant_id: string | null;
        product_id: string | null;
        quantity: number | null;
        unit_price: string | null;
    };
    type ApiCart = {
        id: string;
        completed_at?: string | Date | null;
        line_items: ApiLineItem[];
    };
    type LineItemPut = {
        id?: string;
        title?: string | null;
        description?: string | null;
        thumbnail?: string | null;
        variant_id?: string | null;
        product_id?: string | null;
        quantity?: number | null;
        unit_price?: string | null;
    };
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

    const queryClient = useQueryClient();
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

    type VariantDetail = { title: string; thumbnail: string | null };
    let variantDetailsById = $state(new Map<string, VariantDetail>());

    function treatyErrorMessage(err: unknown): string {
        const o = err as { value?: { message?: string } };
        return o?.value?.message ?? String(err);
    }

    async function ensureSessionId(): Promise<string> {
        let sid = localStorage.getItem(SESSION_STORAGE_KEY);
        if (sid) return sid;
        const res = await client.admin.auth.sessions.post({});
        if (res.error) throw new Error(treatyErrorMessage(res.error));
        const j = res.data as { id: string };
        sid = j.id;
        localStorage.setItem(SESSION_STORAGE_KEY, sid);
        return sid;
    }

    async function createCartRow(sessionId: string): Promise<string> {
        const res = await client.admin.carts.post({
            session_id: sessionId,
            currency_code: DEFAULT_CART_CURRENCY_CODE,
        });
        if (res.error) throw new Error(treatyErrorMessage(res.error));
        const row = res.data as { id: string };
        localStorage.setItem(CART_STORAGE_KEY, row.id);
        return row.id;
    }

    async function fetchCartJson(cartId: string): Promise<ApiCart> {
        const res = await client.admin.carts({ id: cartId }).get();
        if (res.error) throw new Error(treatyErrorMessage(res.error));
        return res.data as ApiCart;
    }

    async function loadShopperCart(): Promise<ApiCart> {
        const sessionId = await ensureSessionId();
        let cartId = localStorage.getItem(CART_STORAGE_KEY);
        if (!cartId) cartId = await createCartRow(sessionId);
        try {
            const fetched = await fetchCartJson(cartId);
            if (fetched.completed_at != null) {
                localStorage.removeItem(CART_STORAGE_KEY);
                cartId = await createCartRow(sessionId);
                return fetchCartJson(cartId);
            }
            return fetched;
        } catch {
            localStorage.removeItem(CART_STORAGE_KEY);
            cartId = await createCartRow(sessionId);
            return fetchCartJson(cartId);
        }
    }

    const cartQuery = createQuery(
        () => ({
            queryKey: ["storefront-cart"] as const,
            queryFn: loadShopperCart,
        }),
        () => queryClient,
    );

    $effect(() => {
        const lineItems = cartQuery.data?.line_items;
        if (!lineItems?.length) {
            variantDetailsById = new Map();
            return;
        }
        const ids = [
            ...new Set(
                lineItems
                    .map((li) => li.variant_id)
                    .filter((id): id is string => Boolean(id)),
            ),
        ];
        if (ids.length === 0) {
            variantDetailsById = new Map();
            return;
        }
        let cancelled = false;
        void (async () => {
            const next = new Map<string, VariantDetail>();
            await Promise.all(
                ids.map(async (id) => {
                    const res = await client.admin["product-variants"]({
                        id,
                    }).get();
                    if (res.error || !res.data) return;
                    const d = res.data as {
                        title: string;
                        thumbnail?: string | null;
                    };
                    next.set(id, {
                        title: d.title,
                        thumbnail: d.thumbnail ?? null,
                    });
                }),
            );
            if (!cancelled) variantDetailsById = next;
        })();
        return () => {
            cancelled = true;
        };
    });

    const cartPending = $derived(
        cartQuery.isPending && cartQuery.data === undefined,
    );
    const cartFailed = $derived(cartQuery.isError);
    const cartItems = $derived.by((): CartRowView[] => {
        const cart = cartQuery.data;
        const map = handleByProductId;
        const thumbs = thumbnailByProductId;
        const vmap = variantDetailsById;
        if (!cart?.line_items?.length) return [];
        return cart.line_items.map((li) => {
            const handle = li.product_id ? map.get(li.product_id) : undefined;
            const href = handle ? `/products/${handle}` : "/";
            const qty = li.quantity ?? 0;
            const pv = parsePrice(li.unit_price ?? "0");
            const vd = li.variant_id ? vmap.get(li.variant_id) : undefined;
            const productThumb = li.product_id
                ? (thumbs.get(li.product_id) ?? null)
                : null;
            const variantLabel =
                (vd?.title && vd.title.trim()) ||
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
                variant: variantLabel || (li.variant_id ? "Variant" : "—"),
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
    const subtotalDisplay = $derived(`$${subtotal.toFixed(2)}`);
    const totalDisplay = $derived(`$${subtotal.toFixed(2)}`);

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
        // Wire to promotions / cart API when available
    }
    function parsePrice(priceStr: string): number {
        const n = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
        return Number.isFinite(n) ? n : 0;
    }

    function lineItemToPut(li: ApiLineItem): LineItemPut {
        return {
            id: li.id,
            title: li.title,
            description: li.description,
            thumbnail: li.thumbnail,
            variant_id: li.variant_id,
            product_id: li.product_id,
            quantity: li.quantity,
            unit_price: li.unit_price,
        };
    }
    async function putLineItems(cartId: string, line_items: LineItemPut[]) {
        const res = await client.admin
            .carts({ id: cartId })
            ["line-items"].put({ line_items });
        if (res.error) throw new Error(treatyErrorMessage(res.error));
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

    function currentCart(): ApiCart | undefined {
        return queryClient.getQueryData<ApiCart>(["storefront-cart"]);
    }
    async function refreshCart() {
        await queryClient.invalidateQueries({ queryKey: ["storefront-cart"] });
    }
    async function changeLineQuantity(lineId: string, delta: number) {
        const cart = currentCart();
        if (!cart?.id) return;
        if (cart.completed_at != null) {
            await refreshCart();
            return;
        }
        const next = cart.line_items
            .map((li) => {
                if (li.id !== lineId) return lineItemToPut(li);
                const q = Math.max(0, (li.quantity ?? 0) + delta);
                return { ...lineItemToPut(li), quantity: q };
            })
            .filter((li) => (li.quantity ?? 0) > 0);
        await putLineItems(cart.id, next);
        await refreshCart();
    }

    async function removeLine(lineId: string) {
        const cart = currentCart();
        if (!cart?.id) return;
        if (cart.completed_at != null) {
            await refreshCart();
            return;
        }
        const next = cart.line_items
            .filter((li) => li.id !== lineId)
            .map(lineItemToPut);
        await putLineItems(cart.id, next);
        await refreshCart();
    }

    async function quickAdd(
        e: MouseEvent,
        product: { id: string; title: string; handle: string },
    ) {
        e.preventDefault();
        e.stopPropagation();
        const cart = currentCart();
        if (!cart?.id) return;
        if (cart.completed_at != null) {
            await refreshCart();
            return;
        }
        const variant_id = await firstVariantIdByProductId(product.id);
        if (!variant_id) return;
        const meta = await fetchVariantLineMeta(variant_id);
        const fallbackThumb = thumbnailByProductId.get(product.id) ?? null;
        const existing = cart.line_items.find(
            (li) => li.variant_id === variant_id,
        );
        let line_items: LineItemPut[];
        if (existing) {
            line_items = cart.line_items.map((li) =>
                li.id === existing.id
                    ? { ...lineItemToPut(li), quantity: (li.quantity ?? 0) + 1 }
                    : lineItemToPut(li),
            );
        } else {
            line_items = [
                ...cart.line_items.map(lineItemToPut),
                {
                    variant_id,
                    product_id: product.id,
                    title: product.title,
                    description: meta?.title ?? null,
                    quantity: 1,
                    unit_price: meta?.unitPrice ?? "0",
                    thumbnail: meta?.thumbnail ?? fallbackThumb,
                },
            ];
        }
        await putLineItems(cart.id, line_items);
        await refreshCart();
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
                {subtotalDisplay}
                {shippingDisplay}
                {discountDisplay}
                {taxDisplay}
                {totalDisplay}
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
