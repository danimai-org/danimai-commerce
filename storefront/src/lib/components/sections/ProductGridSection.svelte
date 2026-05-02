<script lang="ts">
    import { addItemAndOpenSheet } from "$lib/cart/cart-state.svelte";
    import { formatStoreMoney } from "$lib/money";
    import { goto } from "$app/navigation";
    import CartImage from "../productCart/CartImage.svelte";
    import AddToCart from "../productCart/AddToCart.svelte";
    import CartTitle from "../productCart/CartTitle.svelte";

    type ProductGridItem = {
        name: string;
        price: { amount: number; currency_code: string };
        href: string;
        bg: string;
        image: string | null;
        variantId?: string | null;
        variant_id?: string | null;
        variantTitle?: string | null;
        variants?: Array<{ id?: string | null; title?: string | null }>;
        variant?: { id?: string | null; title?: string | null } | null;
    };
    let {
        products = [] as ProductGridItem[] | undefined,
        title = "Essential essentials for everyday.",
        subtitle = "A collection of versatile pieces for your daily movement.",
        catalogMode = false,
    }: {
        products?: ProductGridItem[] | undefined;
        title?: string;
        subtitle?: string;
        catalogMode?: boolean;
    } = $props();
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

    function handleCardKeydown(e: KeyboardEvent, href: string) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        openProduct(href);
    }
</script>

<section class="section products-section" class:catalog-mode={catalogMode}>
    {#if title}
        <h2 class="section-title">{title}</h2>
    {/if}
    {#if subtitle}
        <p class="section-subtitle">{subtitle}</p>
    {/if}
    <div class="product-grid">
        {#each products as product}
            {#if catalogMode}
                <article class="product-card catalog-card">
                    <a
                        href={product.href}
                        class="product-card-link"
                        aria-label={product.name}
                    >
                        <div
                            class="product-image"
                            style="background-color: {product.bg};"
                        >
                            {#if product.image}
                                <img
                                    src={product.image}
                                    alt=""
                                    class="product-img"
                                />
                            {/if}
                        </div>
                        <div class="product-meta">
                            <h3 class="product-name">{product.name}</h3>
                            <p class="product-price">
                                {displayPrice(
                                    product.price.amount,
                                    product.price.currency_code,
                                )}
                            </p>
                        </div>
                    </a>
                    <button
                        type="button"
                        class="quick-add"
                        onclick={(e) => quickAdd(e, product)}
                    >
                        Add to Cart
                    </button>
                </article>
            {:else}
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
                        <AddToCart onAddToCart={(e) => quickAdd(e, product)} />
                    </div>
                </article>
            {/if}
        {/each}
    </div>
</section>

<style>
    .section {
        max-width: var(--section-max-width, 1200px);
        margin: 0 auto;
        padding: var(--section-padding-y, 4rem) var(--section-padding-x, 1.5rem);
        box-sizing: border-box;
    }
    .section-title {
        font-family: var(--font-serif, Georgia, serif);
        font-size: clamp(1.5rem, 3vw, 2.125rem);
        font-weight: 600;
        text-align: center;
        margin: 0 0 0.5rem;
        letter-spacing: -0.02em;
    }
    .section-subtitle {
        text-align: center;
        margin: 0 0 2.5rem;
        color: #555;
        font-size: 0.9375rem;
        line-height: 1.55;
        max-width: 36rem;
        margin-left: auto;
        margin-right: auto;
    }
    .product-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: clamp(1rem, 2vw, 1.75rem);
    }

    .catalog-card {
        position: relative;
        display: block;
    }
    .catalog-card .product-card-link {
        display: block;
        text-decoration: none;
        color: inherit;
    }
    .catalog-card .product-image {
        position: relative;
        aspect-ratio: 1;
        border-radius: 0;
        margin-bottom: 0.75rem;
        overflow: hidden;
        background: #e8e8e8;
    }
    .catalog-card .product-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .catalog-card .quick-add {
        position: absolute;
        z-index: 1;
        bottom: 4rem;
        left: 50%;
        transform: translateX(-50%);
        background: #fff;
        color: #1a1a1a;
        border: none;
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
    }
    .catalog-card:hover .quick-add {
        opacity: 1;
    }
    .catalog-card .product-name {
        font-size: 0.9375rem;
        font-weight: 600;
        margin: 0 0 0.25rem;
        text-align: center;
    }
    .catalog-card .product-price {
        font-size: 0.875rem;
        color: #666;
        margin: 0;
        text-align: center;
    }

    .retail-card {
        display: flex;
        min-height: 0;
    }
    .retail-card-surface {
        display: flex;
        flex-direction: column;
        width: 100%;
        background: #fff;
        border: 1px solid #d9d9d9;
        border-radius: 8px;
        overflow: hidden;
        box-sizing: border-box;
    }
    .retail-card-link {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        text-decoration: none;
        color: inherit;
    }

    .retail-body {
        padding: 0.75rem 1rem 0.5rem;
        flex: 1;
        min-height: 0;
    }
    .retail-title-colume {
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        margin-left: 20px;

        margin-bottom: 0.5rem;
        text-decoration: none;
    }

    @media (max-width: 1024px) {
        .product-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    .catalog-mode {
        padding-top: 1rem;
    }
    .catalog-mode .product-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1.5rem;
    }
    .catalog-mode .product-name {
        text-align: center;
        font-weight: 500;
        font-size: 0.95rem;
        margin: 0;
    }
    .catalog-mode .product-price {
        text-align: center;
        color: #1a1a1a;
        font-size: 1rem;
        margin: 0;
        font-weight: 500;
    }
    .catalog-mode .product-meta {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
    }
    @media (max-width: 1024px) {
        .catalog-mode .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }
    @media (max-width: 640px) {
        .catalog-mode .product-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
