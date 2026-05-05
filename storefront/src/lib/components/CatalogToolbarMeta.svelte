<script lang="ts">
    let {
        loading = false,
        total = 0,
        start = 0,
        end = 0,
        page = 1,
        totalPages = 0,
        hasPreviousPage = false,
        hasNextPage = false,
        onPrevious = () => {},
        onNext = () => {},
    }: {
        loading?: boolean;
        total?: number;
        start?: number;
        end?: number;
        page?: number;
        totalPages?: number;
        hasPreviousPage?: boolean;
        hasNextPage?: boolean;
        onPrevious?: () => void;
        onNext?: () => void;
    } = $props();
</script>

<div class="catalog-toolbar-meta" aria-live="polite">
    {#if loading}
        <span class="catalog-loading">Loading...</span>
    {/if}
    {#if total > 0}
        <span class="catalog-range">{start}-{end} of {total}</span>
    {/if}
    {#if totalPages > 1}
        <div class="catalog-pagination">
            <button
                type="button"
                class="catalog-page-btn"
                disabled={loading || !hasPreviousPage}
                onclick={onPrevious}
            >
                Previous
            </button>
            <span class="catalog-page-num">Page {page} of {totalPages}</span>
            <button
                type="button"
                class="catalog-page-btn"
                disabled={loading || !hasNextPage}
                onclick={onNext}
            >
                Next
            </button>
        </div>
    {/if}
</div>
