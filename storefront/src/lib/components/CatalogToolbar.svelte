<script lang="ts">
    import CatalogToolbarMeta from "$lib/components/CatalogToolbarMeta.svelte";

    type SortOption = { value: string; label: string };

    const defaultSortOptions: SortOption[] = [
        { value: "best-selling", label: "Best selling" },
        { value: "newest", label: "Newest" },
        { value: "title-asc", label: "Title A–Z" },
        { value: "title-desc", label: "Title Z–A" },
    ];
    let {
        sortOptions = defaultSortOptions,
        currentSort = "best-selling",
        currentAvailability = "all",
        currentPrice = "all",
        currentColor = "all",
        productCount = 0,
        loading = false,
        total = 0,
        start = 0,
        end = 0,
        page = 1,
        totalPages = 0,
        hasPreviousPage = false,
        hasNextPage = false,
        onSort = (_e: Event) => {},
        onAvailability = (_e: Event) => {},
        onPrice = (_e: Event) => {},
        onColor = (_e: Event) => {},
        onPrevious = () => {},
        onNext = () => {},
    }: {
        sortOptions?: SortOption[];
        currentSort?: string;
        currentAvailability?: string;
        currentPrice?: string;
        currentColor?: string;
        productCount?: number;
        loading?: boolean;
        total?: number;
        start?: number;
        end?: number;
        page?: number;
        totalPages?: number;
        hasPreviousPage?: boolean;
        hasNextPage?: boolean;
        onSort?: (e: Event) => void;
        onAvailability?: (e: Event) => void;
        onPrice?: (e: Event) => void;
        onColor?: (e: Event) => void;
        onPrevious?: () => void;
        onNext?: () => void;
    } = $props();
</script>

<div class="catalog-toolbar">
    <div class="toolbar-filters">
        <span class="toolbar-label">Filter:</span>
        <select
            class="toolbar-select"
            onchange={onAvailability}
            value={currentAvailability}
            aria-label="Availability"
        >
            <option value="all">Availability</option>
            <option value="in-stock">In stock</option>
            <option value="out-of-stock">Out of stock</option>
        </select>
        <select
            class="toolbar-select"
            onchange={onPrice}
            value={currentPrice}
            aria-label="Price"
        >
            <option value="all">Price</option>
            <option value="0-50">Under €50</option>
            <option value="50-100">€50 - €100</option>
            <option value="100-200">€100 - €200</option>
            <option value="200-plus">€200+</option>
        </select>
        <select
            class="toolbar-select"
            onchange={onColor}
            value={currentColor}
            aria-label="Color"
        >
            <option value="all">Color</option>
            <option value="black">Black</option>
            <option value="white">White</option>
            <option value="gray">Gray</option>
            <option value="navy">Navy</option>
            <option value="green">Green</option>
            <option value="beige">Beige</option>
            <option value="brown">Brown</option>
        </select>
    </div>
    <div class="toolbar-group">
        <label for="catalog-sort" class="toolbar-label">Sort by:</label>
        <select
            id="catalog-sort"
            class="toolbar-select"
            onchange={onSort}
            value={currentSort}
            aria-label="Sort products"
        >
            {#each sortOptions as opt}
                <option value={opt.value}>{opt.label}</option>
            {/each}
        </select>
    </div>
    <span class="product-count"
        >{productCount} {productCount === 1 ? "product" : "products"}</span
    >
</div>

<CatalogToolbarMeta
    {loading}
    {total}
    {start}
    {end}
    {page}
    {totalPages}
    {hasPreviousPage}
    {hasNextPage}
    {onPrevious}
    {onNext}
/>
