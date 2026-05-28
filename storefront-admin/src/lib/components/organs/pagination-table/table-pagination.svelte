<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';

	interface Props {
		pagination: PaginationMeta | null;
		start: number;
		end: number;
		onPageChange: (page: number) => void;
	}
	let { pagination, start, end, onPageChange }: Props = $props();
</script>

<div class="border-t py-4">
	<div class="flex flex-row flex-nowrap items-center justify-between gap-2 px-4 sm:px-6">
		<p class="min-w-0 shrink truncate text-xs text-muted-foreground sm:text-sm">
			{#if pagination && pagination.total > 0}
				{start} – {end} of {pagination.total} results
			{:else}
				No results
			{/if}
		</p>
		{#if pagination && pagination.total > 0}
			<div class="flex shrink-0 flex-row flex-nowrap items-center gap-1.5 sm:gap-2">
				<Button
					variant="outline"
					size="sm"
					class="h-8 shrink-0 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
					disabled={!pagination.has_previous_page}
					onclick={() => onPageChange(pagination.page - 1)}
				>
					Prev
				</Button>
				<span
					class="shrink-0 whitespace-nowrap px-0.5 text-xs text-muted-foreground sm:px-1 sm:text-sm"
				>
					{pagination.page} of {pagination.total_pages} pages
				</span>
				<Button
					variant="outline"
					size="sm"
					class="h-8 shrink-0 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
					disabled={!pagination.has_next_page}
					onclick={() => onPageChange(pagination.page + 1)}
				>
					Next
				</Button>
			</div>
		{/if}
	</div>
</div>
