<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { PaginationTable, TableHead, TableBody, TablePagination, type TableColumn } from '$lib/components/organs/index.js';

	let {
		title,
		columns,
		rows,
		emptyMessage,
		pagination,
		start,
		end,
		onPageChange,
		actionLabel,
		onActionClick
	}: {
		title: string;
		columns: TableColumn[];
		rows: Record<string, unknown>[];
		emptyMessage: string;
		pagination: PaginationMeta | null;
		start: number;
		end: number;
		onPageChange: (pageNum: number) => void;
		actionLabel?: string;
		onActionClick?: () => void;
	} = $props();
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">{title}</h2>
		{#if actionLabel && onActionClick}
			<Button variant="outline" size="sm" onclick={onActionClick}>
				{actionLabel}
			</Button>
		{/if}
	</div>
	<PaginationTable showToolbar={false}>
		<div class="mt-4 min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
			<table class="w-full text-sm">
				<TableHead {columns} />
				<TableBody {rows} {columns} {emptyMessage} />
			</table>
		</div>
		<TablePagination {pagination} {start} {end} {onPageChange} />
	</PaginationTable>
</div>
