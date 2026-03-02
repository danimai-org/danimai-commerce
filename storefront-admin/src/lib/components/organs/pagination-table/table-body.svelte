<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { TableColumn, TableColumnAction } from './type.js';

	let {
		rows = [],
		columns = [],
		emptyMessage = 'No results found.',
		openEdit,
		openDeleteConfirm,
	}: {
		rows: Record<string, unknown>[];
		columns: TableColumn[];
		emptyMessage?: string;
		openEdit?: (item: Record<string, unknown>) => void;
		openDeleteConfirm?: (item: Record<string, unknown>) => void;
	} = $props();

	function isActionsColumn(column: TableColumn): column is TableColumn & { actions: TableColumnAction[] } {
		return column.key === 'actions' && Array.isArray((column as { actions?: TableColumnAction[] }).actions);
	}

	function hasLegacyActions(column: TableColumn): boolean {
		return column.key === 'actions' && (openEdit != null || openDeleteConfirm != null);
	}

	function formatDate(value: unknown): string {
		if (value == null) return '—';
		try {
			return new Date(value as string | Date).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			});
		} catch {
			return String(value);
		}
	}

	function formatBoolean(value: unknown): string {
		if (value === true) return 'Yes';
		if (value === false) return 'No';
		return value != null ? String(value) : '—';
	}

	function isBooleanKey(key: string): boolean {
		return /^(is_|has_)/.test(key) || key === 'default';
	}

	function isDateKey(key: string): boolean {
		return /_(at|date)$/.test(key) || key === 'created_at' || key === 'updated_at';
	}

	function cellValue(column: TableColumn, row: Record<string, unknown>): unknown {
		return row[column.key];
	}

	function renderCell(column: TableColumn, row: Record<string, unknown>): string {
		const value = cellValue(column, row);
		if (column.type === 'date' || (column.type !== 'boolean' && value != null && isDateKey(column.key)))
			return formatDate(value);
		if (column.type === 'boolean' || (value != null && isBooleanKey(column.key)))
			return formatBoolean(value);
		if (value == null || value === '') return '—';
		return String(value);
	}
</script>

<tbody>
	{#if rows.length === 0}
		<tr>
			<td colspan={columns.length} class="px-4 py-8 text-center text-muted-foreground">
				{emptyMessage}
			</td>
		</tr>
	{:else}
		{#each rows as row, i (row.id ?? i)}
			<tr class="border-b transition-colors hover:bg-muted/30">
				{#each columns as column, colIndex}
					{#if isActionsColumn(column)}
						<td class="px-4 py-3">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
								>
									<MoreHorizontal class="size-4" />
									<span class="sr-only">Actions</span>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
									>
										{#each column.actions as action}
											<DropdownMenu.Item
												textValue={action.label}
												class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 {action.key === 'delete' ? 'text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive' : ''}"
												onSelect={() => action.onClick(row)}
											>
												{action.label}
											</DropdownMenu.Item>
										{/each}
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</td>
					{:else if hasLegacyActions(column)}
						<td class="px-4 py-3">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
								>
									<MoreHorizontal class="size-4" />
									<span class="sr-only">Actions</span>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
									>
										{#if openEdit != null}
											<DropdownMenu.Item
												textValue="Edit"
												class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
												onSelect={() => openEdit(row)}
											>
												<Pencil class="size-4" />
												Edit
											</DropdownMenu.Item>
										{/if}
										{#if openDeleteConfirm != null}
											<DropdownMenu.Item
												textValue="Delete"
												class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
												onSelect={() => openDeleteConfirm(row)}
											>
												<Trash2 class="size-4" />
												Delete
											</DropdownMenu.Item>
										{/if}
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</td>
					{:else}
						<td
							class="px-4 py-3 {colIndex === 0 ? 'font-medium' : 'text-muted-foreground'}"
						>
							{#if column.type === 'boolean' || (cellValue(column, row) != null && isBooleanKey(column.key))}
								{@const val = cellValue(column, row)}
								{#if val === true}
									<span
										class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400"
									>
										Yes
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-700 dark:text-red-400"
									>
										No
									</span>
								{/if}
							{:else}
								{renderCell(column, row)}
							{/if}
						</td>
					{/if}
				{/each}
			</tr>
		{/each}
	{/if}
</tbody>
