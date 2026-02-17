<script lang="ts" generics="TData extends Record<string, any>">
	import {
		createSvelteTable,
		flexRender,
		getCoreRowModel,
		getSortedRowModel,
		getPaginationRowModel,
		getFilteredRowModel,
		type ColumnDef,
		type SortingState,
		type VisibilityState,
		type ColumnFiltersState
	} from '@tanstack/svelte-table';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Check from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils.js';

	type DataTableProps<TData> = {
		data: TData[];
		columns: ColumnDef<TData>[];
		enableSorting?: boolean;
		enableRowSelection?: boolean;
		enablePagination?: boolean;
		pageSize?: number;
		onRowSelectionChange?: (selectedRows: TData[]) => void;
		emptyMessage?: string;
		class?: string;
		headerClass?: string;
		bodyClass?: string;
		rowClass?: string | ((row: TData) => string);
		onRowClick?: (row: TData) => void;
		selectedRowIds?: string[];
		getRowId?: (row: TData) => string;
	};

	let {
		data,
		columns,
		enableSorting = true,
		enableRowSelection = false,
		enablePagination = true,
		pageSize = 10,
		onRowSelectionChange,
		emptyMessage = 'No results found.',
		class: className,
		headerClass,
		bodyClass,
		rowClass,
		onRowClick,
		selectedRowIds = [],
		getRowId
	}: DataTableProps<TData> = $props();

	let sorting = $state<SortingState>([]);
	let columnVisibility = $state<VisibilityState>({});
	let columnFilters = $state<ColumnFiltersState>([]);
	let rowSelection = $state<Record<string, boolean>>({});

	// Initialize row selection from selectedRowIds
	$effect(() => {
		if (enableRowSelection && selectedRowIds.length > 0 && getRowId) {
			const newSelection: Record<string, boolean> = {};
			selectedRowIds.forEach((id) => {
				newSelection[id] = true;
			});
			rowSelection = newSelection;
		}
	});

	const table = createSvelteTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
		getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: (updater) => {
			sorting = typeof updater === 'function' ? updater(sorting) : updater;
		},
		onColumnVisibilityChange: (updater) => {
			columnVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
		},
		onColumnFiltersChange: (updater) => {
			columnFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
		},
		onRowSelectionChange: (updater) => {
			rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
			if (onRowSelectionChange) {
				const selectedRows = $table.getSelectedRowModel().rows.map((row: any) => row.original);
				onRowSelectionChange(selectedRows);
			}
		},
		enableRowSelection,
		enableSorting,
		getRowId,
		state: {
			sorting,
			columnVisibility,
			columnFilters,
			rowSelection
		},
		initialState: {
			pagination: {
				pageSize
			}
		}
	});

	const pagination = $derived($table.getState().pagination);
	const selectedRows = $derived($table.getSelectedRowModel().rows);
</script>

<div class={cn('min-h-0 flex-1 overflow-auto rounded-lg border bg-card', className)}>
	<table class="w-full text-sm">
		<thead class={cn('sticky top-0 border-b bg-muted/50', headerClass)}>
			{#each $table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<tr>
					{#if enableRowSelection}
						<th class="w-10 px-4 py-3">
							<input
								type="checkbox"
								checked={$table.getIsAllPageRowsSelected()}
								indeterminate={$table.getIsSomePageRowsSelected() &&
									!$table.getIsAllPageRowsSelected()}
								onchange={(e) => {
									$table.toggleAllPageRowsSelected((e.target as HTMLInputElement).checked);
								}}
								class="size-4 rounded border-input"
								aria-label="Select all"
							/>
						</th>
					{/if}
					{#each headerGroup.headers as header (header.id)}
						<th
							class={cn(
								'px-4 py-3 text-left font-medium',
								header.column.getCanSort() && 'cursor-pointer select-none',
								(header.column.columnDef.meta as { headerClass?: string } | undefined)?.headerClass
							)}
							colspan={header.colSpan}
							style="width: {header.getSize()}px"
							onclick={() => {
								if (header.column.getCanSort()) {
									header.column.toggleSorting();
								}
							}}
						>
							<div class="flex items-center gap-2">
								{#if !header.isPlaceholder}
									{flexRender(header.column.columnDef.header, header.getContext())}
								{/if}
								{#if header.column.getCanSort()}
									<span class="ml-auto">
										{#if header.column.getIsSorted() === 'desc'}
											<ArrowDown class="size-4 text-muted-foreground" />
										{:else if header.column.getIsSorted() === 'asc'}
											<ArrowUp class="size-4 text-muted-foreground" />
										{:else}
											<ArrowUpDown class="size-4 text-muted-foreground opacity-50" />
										{/if}
									</span>
								{/if}
							</div>
						</th>
					{/each}
				</tr>
			{/each}
		</thead>
		<tbody class={bodyClass}>
			{#if $table.getRowModel().rows.length === 0}
				<tr>
					<td
						colspan={columns.length + (enableRowSelection ? 1 : 0)}
						class="px-4 py-8 text-center text-muted-foreground"
					>
						{emptyMessage}
					</td>
				</tr>
			{:else}
				{#each $table.getRowModel().rows as row (row.id)}
					<tr
						class={cn(
							'border-b transition-colors hover:bg-muted/30',
							row.getIsSelected() && 'bg-muted/50',
							typeof rowClass === 'function' ? rowClass(row.original) : rowClass
						)}
						onclick={(e) => {
							// Don't trigger row click if clicking checkbox or action buttons
							if ((e.target as HTMLElement).closest('input[type="checkbox"], button, a')) {
								return;
							}
							if (onRowClick) {
								onRowClick(row.original);
							}
						}}
					>
						{#if enableRowSelection}
							<td class="w-10 px-4 py-3" onclick={(e) => e.stopPropagation()}>
								<input
									type="checkbox"
									checked={row.getIsSelected()}
									onchange={(e) => {
										row.toggleSelected((e.target as HTMLInputElement).checked);
									}}
									class="size-4 rounded border-input"
									aria-label="Select row"
								/>
							</td>
						{/if}
						{#each row.getVisibleCells() as cell (cell.id)}
							<td
								class={cn(
									'px-4 py-3',
									(cell.column.columnDef.meta as { cellClass?: string } | undefined)?.cellClass
								)}
								style="width: {cell.column.getSize()}px"
								onclick={(e) => {
									// Don't propagate clicks on interactive elements
									if ((e.target as HTMLElement).closest('button, a')) {
										e.stopPropagation();
									}
								}}
							>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

{#if enablePagination}
	<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
		<div class="flex items-center gap-2">
			<p class="text-sm text-muted-foreground">Rows per page:</p>
			<select
				value={pagination.pageSize}
				onchange={(e) => {
					$table.setPageSize(Number((e.target as HTMLSelectElement).value));
				}}
				class="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				{#each [10, 20, 30, 50, 100] as size}
					<option value={size}>{size}</option>
				{/each}
			</select>
		</div>
		<div class="flex items-center gap-2">
			<p class="text-sm text-muted-foreground">
				{#if $table.getFilteredRowModel().rows.length > 0}
					{pagination.pageIndex * pagination.pageSize + 1}–
					{Math.min(
						(pagination.pageIndex + 1) * pagination.pageSize,
						$table.getFilteredRowModel().rows.length
					)}{' '}
					of {$table.getFilteredRowModel().rows.length}
				{:else}
					0 results
				{/if}
			</p>
			{#if $table.getPageCount() > 1}
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!$table.getCanPreviousPage()}
						onclick={() => $table.previousPage()}
					>
						<ChevronLeft class="size-4" />
						<span class="sr-only">Previous page</span>
					</Button>
					<span class="text-sm text-muted-foreground">
						{pagination.pageIndex + 1} of {$table.getPageCount()} pages
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={!$table.getCanNextPage()}
						onclick={() => $table.nextPage()}
					>
						<ChevronRight class="size-4" />
						<span class="sr-only">Next page</span>
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if enableRowSelection && selectedRows.length > 0}
	<div class="mt-2 text-sm text-muted-foreground">
		{selectedRows.length} row{selectedRows.length === 1 ? '' : 's'} selected
	</div>
{/if}
