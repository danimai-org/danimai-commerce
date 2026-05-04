<script lang="ts">
    import { afterNavigate } from "$app/navigation";
    import { cartState, openCartSheet } from "$lib/cart/cart-state.svelte";
    import { search } from "$lib/stores/search";
    import SearchSheet from "$lib/components/search/SearchSheet.svelte";
    import {
        createPagination,
        createPaginationQuery,
        type PaginationMeta,
    } from "$lib/api/pagination.svelte";

    import { client } from "$lib/api/client.js";
    import {
        type CategoryNavRow,
        isBottomCategory,
        isChildCategory,
    } from "$lib/category-nav";

    type CategoryRow = CategoryNavRow;

    type CollectionRow = {
        id: string;
        title: string;
        handle: string;
    };

    let cartCount = $state(0);
    let searchOpen = $state(false);
    let menuOpen = $state(false);
    let accountMenuOpen = $state(false);
    let navWide = $state(false);

    afterNavigate(() => {
        menuOpen = false;
        accountMenuOpen = false;
    });

    $effect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(min-width: 768px)");
        const set = () => {
            navWide = mq.matches;
        };
        set();
        mq.addEventListener("change", set);
        return () => mq.removeEventListener("change", set);
    });

    $effect(() => {
        const lineItems = cartState.cart?.line_items ?? [];
        cartCount = lineItems.reduce((n, i) => n + (i.quantity ?? 0), 0);
    });
    $effect(() => {
        const unsub = search.subscribe((s) => {
            searchOpen = s.open;
        });
        return unsub;
    });

    const NAV_PARAMS = new URLSearchParams({ page: "1", limit: "100" });

    function emptyPagination(): PaginationMeta {
        return {
            total: 0,
            page: 1,
            limit: 100,
            total_pages: 0,
            has_next_page: false,
            has_previous_page: false,
        };
    }

    function unwrapRows<T>(data: unknown): T[] {
        if (!data || typeof data !== "object") return [];
        const o = data as Record<string, unknown>;
        if (Array.isArray(o.rows)) return o.rows as T[];
        if (o.data && typeof o.data === "object") {
            const inner = o.data as Record<string, unknown>;
            if (Array.isArray(inner.rows)) return inner.rows as T[];
        }
        return [];
    }

    function unwrapPagination(data: unknown): PaginationMeta | null {
        if (!data || typeof data !== "object") return null;
        const o = data as Record<string, unknown>;
        if (o.pagination && typeof o.pagination === "object")
            return o.pagination as PaginationMeta;
        if (o.data && typeof o.data === "object") {
            const inner = o.data as Record<string, unknown>;
            if (inner.pagination && typeof inner.pagination === "object")
                return inner.pagination as PaginationMeta;
        }
        return null;
    }

    const productCategoriesState = createPagination(
        async () => {
            const res = await client.admin["product-categories"].get({
                query: createPaginationQuery(NAV_PARAMS),
            });
            if (res.error) {
                return {
                    rows: [] as CategoryRow[],
                    pagination: emptyPagination(),
                };
            }
            const body = res.data as unknown;
            return {
                rows: unwrapRows<CategoryRow>(body),
                pagination: unwrapPagination(body) ?? emptyPagination(),
            };
        },
        ["product-categories"],
        createPaginationQuery(NAV_PARAMS),
        { keySuffix: () => ["nav"] },
    );

    const collectionsState = createPagination(
        async () => {
            const res = await client.admin["collections"].get({
                query: createPaginationQuery(NAV_PARAMS),
            });
            if (res.error) {
                return {
                    rows: [] as CollectionRow[],
                    pagination: emptyPagination(),
                };
            }
            const body = res.data as unknown;
            return {
                rows: unwrapRows<CollectionRow>(body),
                pagination: unwrapPagination(body) ?? emptyPagination(),
            };
        },
        ["collections"],
        createPaginationQuery(NAV_PARAMS),
        { keySuffix: () => ["nav"] },
    );

    const { query: productCategoriesQuery } = productCategoriesState;
    const { query: collectionsQuery } = collectionsState;

    const productCategories = $derived(
        (productCategoriesQuery.data?.rows ?? []) as CategoryRow[],
    );
    const navCollections = $derived(
        (collectionsQuery.data?.rows ?? []) as CollectionRow[],
    );

    const navCategoryPool = $derived(
        productCategories.filter(isChildCategory).length > 0
            ? productCategories.filter(isChildCategory)
            : productCategories,
    );
    const bottoms = $derived(navCategoryPool.filter(isBottomCategory));
    const tops = $derived(navCategoryPool.filter((c) => !isBottomCategory(c)));

    $effect(() => {
        if (!menuOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") menuOpen = false;
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener("keydown", onKey);
        };
    });

    $effect(() => {
        if (!accountMenuOpen) return;
        const onDocClick = () => {
            accountMenuOpen = false;
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") accountMenuOpen = false;
        };
        document.addEventListener("click", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("click", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    });
</script>

<header class="site-header">
    <nav class="nav" class:nav--mobile-search-open={searchOpen && !navWide}>
        <a href="/" class="brand">DANIMAI STORE</a>
        <ul class="nav-links nav-links--desktop">
            <li class="nav-dropdown">
                <button type="button" class="nav-item">
                    Tops
                    <svg
                        class="chevron"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
                    >
                </button>
                <div class="dropdown-menu" aria-hidden="true">
                    <a href="/categories/all-tops">All Tops</a>
                    {#each tops as top}
                        <a href="/categories/{top.handle}">{top.value}</a>
                    {/each}
                </div>
            </li>
            <li class="nav-dropdown">
                <button type="button" class="nav-item">
                    Bottoms
                    <svg
                        class="chevron"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
                    >
                </button>
                <div class="dropdown-menu" aria-hidden="true">
                    <a href="/categories/all-bottoms">All Bottoms</a>
                    {#each bottoms as bottom}
                        <a href="/categories/{bottom.handle}">{bottom.value}</a>
                    {/each}
                </div>
            </li>
            <li class="nav-dropdown">
                <button type="button" class="nav-item">
                    Collections
                    <svg
                        class="chevron"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
                    >
                </button>
                <div class="dropdown-menu" aria-hidden="true">
                    <a href="/store">Shop All</a>
                    {#each navCollections as col}
                        <a href="/collections/{col.handle}">{col.title}</a>
                    {/each}
                    {#if navCollections.length === 0}
                        <a href="/store">Shop all</a>
                    {/if}
                </div>
            </li>
            <li>
                <a href="/about" class="nav-item nav-link-plain">About</a>
            </li>
        </ul>
        <div
            class="nav-end"
            class:nav-end--search-open={searchOpen && !navWide}
        >
            {#if navWide}
                <SearchSheet persistent={true} />
            {:else if !searchOpen}
                <button
                    type="button"
                    class="icon-btn"
                    aria-label="Search"
                    onclick={() => {
                        menuOpen = false;
                        accountMenuOpen = false;
                        search.open();
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><circle cx="11" cy="11" r="8" /><path
                            d="m21 21-4.35-4.35"
                        /></svg
                    >
                </button>
            {/if}
            <div class="nav-actions-icons">
                <div class="nav-account-wrap">
                    <button
                        type="button"
                        class="icon-btn icon-btn--account"
                        aria-label="Account"
                        aria-expanded={accountMenuOpen}
                        aria-haspopup="true"
                        onclick={(e) => {
                            e.stopPropagation();
                            accountMenuOpen = !accountMenuOpen;
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.75"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            ><path
                                d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
                            /><circle cx="12" cy="7" r="4" /></svg
                        >
                    </button>
                    {#if accountMenuOpen}
                        <div
                            class="account-dropdown"
                            role="menu"
                            aria-label="Account"
                        >
                            <a
                                href="/login"
                                class="account-dropdown-link"
                                role="menuitem"
                                onclick={() => (accountMenuOpen = false)}
                                >Login</a
                            >
                        </div>
                    {/if}
                </div>
                <button
                    type="button"
                    class="icon-btn cart-btn"
                    aria-label="Cart"
                    onclick={() => {
                        menuOpen = false;
                        accountMenuOpen = false;
                        openCartSheet();
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path
                            d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"
                        /><path d="M3 6h18" /><path
                            d="M16 10a4 4 0 0 1-8 0"
                        /></svg
                    >
                    {#if cartCount > 0}
                        <span class="cart-badge">{cartCount}</span>
                    {/if}
                </button>
                <button
                    type="button"
                    class="icon-btn menu-trigger"
                    aria-label="Open menu"
                    aria-expanded={menuOpen}
                    onclick={() => (menuOpen = !menuOpen)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        ><circle cx="5" cy="12" r="1.5" /><circle
                            cx="12"
                            cy="12"
                            r="1.5"
                        /><circle cx="19" cy="12" r="1.5" /></svg
                    >
                </button>
            </div>
        </div>
    </nav>
    {#if searchOpen && !navWide}
        <div class="nav-mobile-search">
            <SearchSheet persistent={false} />
        </div>
    {/if}
</header>

{#if menuOpen}
    <button
        type="button"
        class="drawer-backdrop"
        aria-label="Close menu"
        onclick={() => (menuOpen = false)}
    ></button>
    <aside class="mobile-drawer" aria-label="Site menu">
        <div class="drawer-header">
            <span class="drawer-title">Menu</span>
            <button
                type="button"
                class="drawer-close"
                aria-label="Close menu"
                onclick={() => (menuOpen = false)}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
                >
            </button>
        </div>
        <nav class="drawer-nav">
            <section class="drawer-section">
                <h2 class="drawer-cat">Tops</h2>
                <a
                    href="/categories/all-tops"
                    class="drawer-link"
                    onclick={() => (menuOpen = false)}>All Tops</a
                >
                {#each tops as top}
                    <a
                        href="/categories/{top.handle}"
                        class="drawer-link"
                        onclick={() => (menuOpen = false)}>{top.value}</a
                    >
                {/each}
            </section>
            <section class="drawer-section">
                <h2 class="drawer-cat">Bottoms</h2>
                <a
                    href="/categories/all-bottoms"
                    class="drawer-link"
                    onclick={() => (menuOpen = false)}>All Bottoms</a
                >
                {#each bottoms as bottom}
                    <a
                        href="/categories/{bottom.handle}"
                        class="drawer-link"
                        onclick={() => (menuOpen = false)}>{bottom.value}</a
                    >
                {/each}
            </section>
            <section class="drawer-section">
                <h2 class="drawer-cat">Collections</h2>
                {#each navCollections as col}
                    <a
                        href="/collections/{col.handle}"
                        class="drawer-link"
                        onclick={() => (menuOpen = false)}>{col.title}</a
                    >
                {/each}
                {#if navCollections.length === 0}
                    <a
                        href="/store"
                        class="drawer-link"
                        onclick={() => (menuOpen = false)}>Shop all</a
                    >
                {/if}
            </section>
            <a
                href="/about"
                class="drawer-link drawer-link--standalone"
                onclick={() => (menuOpen = false)}>About</a
            >
            <section class="drawer-section">
                <h2 class="drawer-cat">Account</h2>
                <a
                    href="/login"
                    class="drawer-link"
                    onclick={() => (menuOpen = false)}>Login</a
                >
                <a
                    href="/register"
                    class="drawer-link"
                    onclick={() => (menuOpen = false)}>Register</a
                >
            </section>
        </nav>
    </aside>
{/if}

