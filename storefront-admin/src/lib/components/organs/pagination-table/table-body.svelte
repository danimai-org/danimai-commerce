<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { Button } from '$lib/components/ui/button/index.js';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ImageIcon from '@lucide/svelte/icons/image';
	import type { TableColumn, TableColumnAction } from './type.js';
	import { resolve } from '$app/paths';

	let {
		rows = [],
		columns = [],
		emptyMessage = 'No results found.',
		openEdit,
		openDeleteConfirm,
		selectedIds,
		onToggleSelect,
		disabledIds,
		rowIdKey = 'id',
		onRowClick
	}: {
		rows: Record<string, unknown>[];
		columns: TableColumn[];
		emptyMessage?: string;
		openEdit?: (item: Record<string, unknown>) => void;
		openDeleteConfirm?: (item: Record<string, unknown>) => void;
		selectedIds?: Set<string>;
		onToggleSelect?: (id: string) => void;
		disabledIds?: Set<string>;
		rowIdKey?: string;
		onRowClick?: (item: Record<string, unknown>) => void;
	} = $props();

	const showSelection = $derived(selectedIds != null && onToggleSelect != null);
	const totalCols = $derived(columns.length + (showSelection ? 1 : 0));

	function isActionsColumn(
		column: TableColumn
	): column is TableColumn & { actions: TableColumnAction[] } {
		return (
			column.key === 'actions' &&
			Array.isArray((column as { actions?: TableColumnAction[] }).actions)
		);
	}

	function hasLegacyActions(column: TableColumn): boolean {
		return column.key === 'actions' && (openEdit != null || openDeleteConfirm != null);
	}

	function isLinkColumn(column: TableColumn): boolean {
		return (
			column.type === 'link' &&
			(typeof column.cellHref === 'function' || typeof column.cellHref === 'string')
		);
	}

	function linkHref(column: TableColumn, row: Record<string, unknown>): string {
		const cellHref = column.cellHref;
		if (typeof cellHref === 'function') return cellHref(row);
		if (typeof cellHref === 'string' && cellHref.includes('{{')) {
			return cellHref.replace(/\{\{(\w+)\}\}/g, (_, k) => String(row[k] ?? ''));
		}
		return typeof cellHref === 'string' ? cellHref + String(row[column.key] ?? '') : '#';
	}

	function linkText(column: TableColumn, row: Record<string, unknown>): string {
		const linkLabel = (column as { linkLabel?: string }).linkLabel;
		if (linkLabel) return linkLabel;
		const textKey = (column as { textKey?: string }).textKey ?? column.key;
		return String(row[textKey] ?? '-');
	}

	function getThumbUrl(column: TableColumn, row: Record<string, unknown>): string | null {
		const k = (column as { thumbnailKey?: string }).thumbnailKey;
		if (!k) return null;
		const v = row[k];
		return typeof v === 'string' ? v : null;
	}

	function formatDate(value: unknown): string {
		if (value == null || value === '') return '—';
		try {
			const date = new Date(value as string | Date);
			if (Number.isNaN(date.getTime())) return '—';
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return '—';
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
		if (
			column.type === 'date' ||
			(column.type !== 'boolean' && value != null && isDateKey(column.key))
		)
			return formatDate(value);
		if (column.type === 'boolean' || (value != null && isBooleanKey(column.key)))
			return formatBoolean(value);
		if (value == null || value === '') return '—';
		return String(value);
	}

	function statusBadgeClasses(status: unknown): string {
		const s = String(status ?? '').toLowerCase();
		switch (s) {
			case 'succeeded':
			case 'success':
			case 'fulfilled':
				return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
			case 'pending':
			case 'processing':
				return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
			case 'failed':
			case 'cancelled':
			case 'canceled':
				return 'bg-destructive/15 text-destructive';
			case 'partially_fulfilled':
				return 'bg-blue-500/15 text-blue-700 dark:text-blue-400';
			case 'not_fulfilled':
				return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
			case 'published':
				return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
			case 'draft':
				return 'bg-slate-500/15 text-slate-700 dark:text-slate-300';
			case 'proposed':
				return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
			case 'rejected':
				return 'bg-destructive/15 text-destructive';
			default:
				return 'bg-violet-500/15 text-violet-700 dark:text-violet-400';
		}
	}
</script>

<tbody>
	{#if rows.length === 0}
		<tr>
			<td colspan={totalCols} class="px-4 py-8 text-center text-muted-foreground">
				{emptyMessage}
			</td>
		</tr>
	{:else}
		{#each rows as row, i (row.id ?? i)}
			{@const rowId = String(row[rowIdKey] ?? '')}
			{@const isRowDisabled = disabledIds?.has(rowId) ?? false}
			<tr
				class="border-b transition-colors hover:bg-muted/30 {onRowClick && !isRowDisabled
					? 'cursor-pointer'
					: ''}"
				onclick={() => !isRowDisabled && onRowClick?.(row)}
			>
				{#if showSelection}
					<td class="px-4 py-3" onclick={(e) => e.stopPropagation()}>
						{#if !isRowDisabled}
							<input
								type="checkbox"
								class="h-4 w-4 rounded border-input accent-primary"
								checked={selectedIds?.has(rowId) ?? false}
								onchange={() => onToggleSelect?.(rowId)}
							/>
						{/if}
					</td>
				{/if}
				{#each columns as column, colIndex (column.key)}
					{#if isLinkColumn(column)}
						<td class="px-4 py-3">
							<a
								href={resolve(linkHref(column, row), {})}
								class="flex items-center gap-3 font-medium hover:opacity-80"
							>
								{#if getThumbUrl(column, row)}
									<img
										src={getThumbUrl(column, row)!}
										alt=""
										class="size-10 shrink-0 rounded-md object-cover"
									/>
								{:else if (column as { thumbnailKey?: string }).thumbnailKey}
									<div
										class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
									>
										<ImageIcon class="size-5" />
									</div>
								{/if}
								<span>{linkText(column, row)}</span>
							</a>
						</td>
					{:else if isActionsColumn(column)}
						<td class="px-4 py-3" onclick={(e) => e.stopPropagation()}>
							{#if column.actionsDisplay === 'inline'}
								<div class="flex flex-wrap items-center gap-2">
									{#each column.actions as action (action.key)}
										<Button
											type="button"
											variant={action.key === 'delete' ? 'destructive' : 'outline'}
											size="sm"
											class="h-8 rounded-md"
											onclick={() => action.onClick(row)}
										>
											{action.label}
										</Button>
									{/each}
								</div>
							{:else}
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
											{#each column.actions as action (action.key)}
												<DropdownMenu.Item
													textValue={action.label}
													class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 {action.key ===
													'delete'
														? 'text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive'
														: ''}"
													onclick={() => action.onClick(row)}
												>
													{action.label}
												</DropdownMenu.Item>
											{/each}
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							{/if}
						</td>
					{:else if hasLegacyActions(column)}
						<td class="px-4 py-3" onclick={(e) => e.stopPropagation()}>
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
												onclick={() => openEdit(row)}
											>
												<Pencil class="size-4" />
												Edit
											</DropdownMenu.Item>
										{/if}
										{#if openDeleteConfirm != null}
											<DropdownMenu.Item
												textValue="Delete"
												class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
												onclick={() => openDeleteConfirm(row)}
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
						<td class="px-4 py-3 {colIndex === 0 ? 'font-medium' : 'text-muted-foreground'}">
							{#if column.type === 'statusBadge'}
								{@const raw = cellValue(column, row)}
								{#if raw == null || raw === ''}
									<span class="text-muted-foreground">—</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize {statusBadgeClasses(
											raw
										)}">{String(raw)}</span
									>
								{/if}
							{:else if column.type === 'boolean' || (cellValue(column, row) != null && isBooleanKey(column.key))}
								{@const val = cellValue(column, row)}
								{#if val === true}
									<span
										class="inline-flex items-center rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400"
									>
										Yes
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400"
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
