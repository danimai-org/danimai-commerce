<script lang="ts">
	type SortOption = { value: string; label: string };
	type Props = {
		loading?: boolean;
		start?: number;
		end?: number;
		total?: number;
		totalPages?: number;
		page?: number;
		hasNextPage?: boolean;
		hasPreviousPage?: boolean;
		productCount?: number;
		currentSort?: string;
		currentAvailability?: string;
		currentPrice?: string;
		currentColor?: string;
		sortOptions?: SortOption[];
		onSort?: (e: Event) => void;
		onAvailability?: (e: Event) => void;
		onPrice?: (e: Event) => void;
		onColor?: (e: Event) => void;
		onPrevious?: () => void;
		onNext?: () => void;
	};

	let {
		loading = false,
		start = 0,
		end = 0,
		total = 0,
		totalPages = 0,
		page = 1,
		hasNextPage = false,
		hasPreviousPage = false,
		productCount = 0,
		currentSort = 'best-selling',
		currentAvailability = 'all',
		currentPrice = 'all',
		currentColor = 'all',
		sortOptions = [] as SortOption[],
		onSort = (_e: Event) => {},
		onAvailability = (_e: Event) => {},
		onPrice = (_e: Event) => {},
		onColor = (_e: Event) => {},
		onPrevious = () => {},
		onNext = () => {}
	}: Props = $props();
</script>

<div class="catalog-toolbar">
	<div class="toolbar-filters">
		<span class="toolbar-label">Filter:</span>
		<select class="toolbar-select" onchange={onAvailability} value={currentAvailability} aria-label="Availability">
			<option value="all">Availability</option>
			<option value="in-stock">In stock</option>
			<option value="out-of-stock">Out of stock</option>
		</select>
		<select class="toolbar-select" onchange={onPrice} value={currentPrice} aria-label="Price">
			<option value="all">Price</option>
			<option value="0-50">Under €50</option>
			<option value="50-100">€50 - €100</option>
			<option value="100-200">€100 - €200</option>
			<option value="200-plus">€200+</option>
		</select>
		<select class="toolbar-select" onchange={onColor} value={currentColor} aria-label="Color">
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
		<select id="catalog-sort" class="toolbar-select" onchange={onSort} value={currentSort} aria-label="Sort products">
			{#each sortOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>
	<span class="product-count">{productCount} {productCount === 1 ? 'product' : 'products'}</span>
</div>

<div class="catalog-toolbar-meta" aria-live="polite">
	{#if loading}
		<span class="catalog-loading">Loading...</span>
	{/if}
	{#if total > 0}
		<span class="catalog-range">{start}-{end} of {total}</span>
	{/if}
	{#if totalPages > 1}
		<div class="catalog-pagination">
			<button type="button" class="catalog-page-btn" disabled={loading || !hasPreviousPage} onclick={onPrevious}>
				Previous
			</button>
			<span class="catalog-page-num">Page {page} of {totalPages}</span>
			<button type="button" class="catalog-page-btn" disabled={loading || !hasNextPage} onclick={onNext}>
				Next
			</button>
		</div>
	{/if}
</div>
