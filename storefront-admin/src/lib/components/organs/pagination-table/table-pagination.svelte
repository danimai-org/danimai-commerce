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

<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
	<p class="text-sm text-muted-foreground">
		{#if pagination && pagination.total > 0}
			{start} – {end} of {pagination.total} results
		{:else}
			0 results
		{/if}
	</p>
	<div class="flex items-center gap-2">
		<Button
			variant="outline"
			size="sm"
			disabled={!pagination?.has_previous_page}
			onclick={() => onPageChange((pagination?.page ?? 1) - 1)}
		>
			Prev
		</Button>
		<span class="text-sm text-muted-foreground">
			{pagination?.page ?? 1} of {pagination?.total_pages ?? 1} pages
		</span>
		<Button
			variant="outline"
			size="sm"
			disabled={!pagination?.has_next_page}
			onclick={() => onPageChange((pagination?.page ?? 1) + 1)}
		>
			Next
		</Button>
	</div>
</div>
