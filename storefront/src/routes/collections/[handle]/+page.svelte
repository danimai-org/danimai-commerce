<script lang="ts">
    import { SiteHeader, SiteFooter } from "$lib/components/layout";
    import ProductGridSection from "$lib/components/ProductGridSection.svelte";
    import CatalogToolbar from "$lib/components/CatalogToolbar.svelte";
    import { API_BASE, rowsFromPaginated } from "$lib/api/storefront-api";

    import {
        createPagination,
        createPaginationQuery,
        type PaginationMeta,
    } from "$lib/api/pagination.svelte";
    import { client } from "$lib/api/client.js";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { SvelteURLSearchParams } from "svelte/reactivity";
    import type { AdminCollectionRow } from "$lib/types/collection";
    import type { StorefrontProductListRow } from "$lib/types/product";
    import {
        type ProductGridItem,
        toProductGridItem,
    } from "$lib/types/product-grid";

    const STOREFRONT_SORT: Record<
        string,
        { field: string; dir: "asc" | "desc" }
    > = {
        "best-selling": { field: "products.title", dir: "desc" },
        newest: { field: "products.handle", dir: "desc" },
        "title-asc": { field: "products.title", dir: "asc" },
        "title-desc": { field: "products.title", dir: "desc" },
    };
    function slugify(value: string): string {
        return value
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }
    function prettyHandle(handle: string): string {
        return handle
            .split("-")
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }
    function emptyPagination(): PaginationMeta {
        return {
            total: 0,
            page: 1,
            limit: 24,
            total_pages: 0,
            has_next_page: false,
            has_previous_page: false,
        };
    }
    const paginateState = createPagination(
        async () => {
            const requestedHandle = (page.params.handle ?? "")
                .trim()
                .toLowerCase();
            const collectionRes = await client.admin["collections"].get({
                query: {
                    ...createPaginationQuery(
                        new URLSearchParams({ page: "1", limit: "100" }),
                    ),
                },
            });
            if (collectionRes.error) {
                const err = collectionRes.error as {
                    value?: { message?: string };
                };
                throw new Error(
                    err?.value?.message ?? String(collectionRes.error),
                );
            }
            const collectionPayload = collectionRes.data as
                | { rows?: AdminCollectionRow[] }
                | undefined;
            const collectionRows = collectionPayload?.rows ?? [];
            const collection =
                collectionRows.find((row) => {
                    const byHandle = (row.handle ?? "").trim().toLowerCase();
                    const byTitle = slugify(row.title ?? "");
                    return (
                        requestedHandle === byHandle ||
                        requestedHandle === byTitle
                    );
                }) ?? null;
            if (!collection?.id) {
                return {
                    rows: [],
                    pagination: emptyPagination(),
                    collectionTitle: prettyHandle(requestedHandle),
                };
            }
            const root = API_BASE.replace(/\/admin\/?$/, "");
            const pq = createPaginationQuery(
                new SvelteURLSearchParams(page.url.search),
            );
            const pageStr =
                pq.page != null && String(pq.page) !== ""
                    ? String(pq.page)
                    : "1";
            const limitStr =
                pq.limit != null && String(pq.limit) !== ""
                    ? String(pq.limit)
                    : "10";
            const sortKey = page.url.searchParams.get("sort") ?? "best-selling";
            const sortCfg =
                STOREFRONT_SORT[sortKey] ?? STOREFRONT_SORT["best-selling"];
            const sp = new URLSearchParams({
                page: pageStr,
                limit: limitStr,
                sorting_field: sortCfg.field,
                sorting_direction: sortCfg.dir,
            });
            sp.set(
                "filters",
                JSON.stringify({ collection_ids: collection.id }),
            );
            const productsRes = await fetch(
                `${root}/storefront/products?${sp}`,
                {
                    cache: "no-store",
                },
            );
            if (!productsRes.ok) {
                throw new Error("Failed to load collection products");
            }
            const raw = (await productsRes.json()) as unknown;
            const { rows: productRows } =
                rowsFromPaginated<StorefrontProductListRow>(raw);
            const pagination =
                (raw as { pagination?: PaginationMeta }).pagination ??
                emptyPagination();
            const gridProducts: ProductGridItem[] = productRows.map((p, i) =>
                toProductGridItem(p, i, { preferProductThumbnail: true }),
            );
            return {
                rows: gridProducts,
                pagination,
                collectionTitle: collection.title,
            };
        },
        ["collection-products"],
        createPaginationQuery(new SvelteURLSearchParams(page.url.search)),
        {
            keySuffix: () => [page.params.handle ?? "", page.url.search],
        },
    );

    const { query } = paginateState;

    const loading = $derived(paginateState.loading);
    const fetchError = $derived(paginateState.error);
    const rows = $derived((query.data?.rows ?? []) as ProductGridItem[]);
    const pagination = $derived(paginateState.pagination);
    const start = $derived(paginateState.start);
    const end = $derived(paginateState.end);
    const activeHandle = $derived((page.params.handle ?? "").toLowerCase());
    const pageRows = $derived(rows);
    const heroTitle = $derived(
        query.data?.collectionTitle ??
            (activeHandle ? prettyHandle(activeHandle) : "Collection"),
    );
    const sortOptions = [
        { value: "best-selling", label: "Best selling" },
        { value: "newest", label: "Newest" },
        { value: "title-asc", label: "Title A-Z" },
        { value: "title-desc", label: "Title Z-A" },
    ];
    const productCount = $derived(
        (pagination?.total ?? 0) > 0
            ? (pagination?.total ?? 0)
            : pageRows.length,
    );

    const gridProducts = $derived(pageRows);

    function gotoWithParams(updates: Record<string, string>) {
        const u = new URL(page.url);
        for (const [k, v] of Object.entries(updates)) {
            if (v === "all" || !v) u.searchParams.delete(k);
            else u.searchParams.set(k, v);
        }
        goto(u.pathname + u.search, { replaceState: true });
    }

    function applySort(e: Event) {
        gotoWithParams({ sort: (e.currentTarget as HTMLSelectElement).value });
    }
    function applyAvailability(e: Event) {
        gotoWithParams({
            availability: (e.currentTarget as HTMLSelectElement).value,
        });
    }
    function applyPrice(e: Event) {
        gotoWithParams({ price: (e.currentTarget as HTMLSelectElement).value });
    }
    function applyColor(e: Event) {
        gotoWithParams({ color: (e.currentTarget as HTMLSelectElement).value });
    }

    const currentSort = $derived(
        page.url.searchParams.get("sort") ?? "best-selling",
    );
    const currentAvailability = $derived(
        page.url.searchParams.get("availability") ?? "all",
    );
    const currentPrice = $derived(page.url.searchParams.get("price") ?? "all");
    const currentColor = $derived(page.url.searchParams.get("color") ?? "all");

    function goToPage(nextPage: number) {
        const u = new URL(page.url);
        u.searchParams.set("page", String(nextPage));
        goto(u.toString());
    }
</script>

<SiteHeader />

{#if fetchError}
    <main class="collection-main">
        <p class="collection-error">{fetchError}</p>
    </main>
{:else}
    <main class="collection-main">
        <section class="collection-hero" aria-label={heroTitle}>
            <h1 class="collection-hero-title">{heroTitle}</h1>
        </section>
        <CatalogToolbar
            {loading}
            {start}
            {end}
            total={pagination?.total ?? 0}
            totalPages={pagination?.total_pages ?? 0}
            page={pagination?.page ?? 1}
            hasNextPage={pagination?.has_next_page ?? false}
            hasPreviousPage={pagination?.has_previous_page ?? false}
            {productCount}
            {currentSort}
            {currentAvailability}
            {currentPrice}
            {currentColor}
            {sortOptions}
            onSort={applySort}
            onAvailability={applyAvailability}
            onPrice={applyPrice}
            onColor={applyColor}
            onPrevious={() => goToPage((pagination?.page ?? 1) - 1)}
            onNext={() => goToPage((pagination?.page ?? 1) + 1)}
        />
        <ProductGridSection products={gridProducts} title="" subtitle="" />
    </main>
{/if}

<SiteFooter />
