<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		type TableColumn
	} from '$lib/components/organs/pagination-table/index.js';

	type DetailPagination = {
		page: number;
		total: number;
		total_pages: number;
		has_previous_page?: boolean;
		has_next_page?: boolean;
	};

	interface Props {
		title?: string;
		rows: Record<string, unknown>[];
		columns: TableColumn[];
		emptyMessage?: string;
		loading?: boolean;
		error?: string | null;
		pagination?: DetailPagination | null;
		start?: number;
		end?: number;
		onPageChange?: (page: number) => void;
		showAddButton?: boolean;
		addButtonLabel?: string;
		onAdd?: () => void;
		showSearchInput?: boolean;
		searchValue?: string;
		searchPlaceholder?: string;
		onSearchChange?: (value: string) => void;
		showSortButton?: boolean;
		sortButtonLabel?: string;
		onSortClick?: () => void;
		showSortIconButton?: boolean;
		onSortIconClick?: () => void;
	}

	let {
		title = 'Products',
		rows,
		columns,
		emptyMessage = 'No results found.',
		loading = false,
		error = null,
		pagination = null,
		start = 0,
		end = 0,
		onPageChange,
		showAddButton = true,
		addButtonLabel = 'Add',
		onAdd,
		showSearchInput = true,
		searchValue = '',
		searchPlaceholder = 'Search',
		onSearchChange,
		showSortButton = true,
		sortButtonLabel = 'Sort',
		onSortClick,
		showSortIconButton = true,
		onSortIconClick
	}: Props = $props();

	const canPaginate = $derived(Boolean(pagination && onPageChange));
	const prevDisabled = $derived(
		!pagination ||
			(pagination.has_previous_page != null
				? !pagination.has_previous_page
				: pagination.page <= 1)
	);
	const nextDisabled = $derived(
		!pagination ||
			(pagination.has_next_page != null
				? !pagination.has_next_page
				: pagination.page >= pagination.total_pages)
	);
</script>

<section class="rounded-lg border bg-card shadow-sm overflow-hidden">
	<div class="flex flex-wrap items-center justify-between gap-4 border-b bg-card px-6 py-4 rounded-t-lg">
		<h2 class="text-base font-semibold">{title}</h2>
			<div class="flex items-center gap-2">
				{#if showAddButton}
					<Button type="button" size="sm" class="rounded-md" onclick={() => onAdd?.()}>
						{addButtonLabel}
					</Button>
				{/if}
				{#if showSortButton}
					<Button variant="outline" size="sm" class="rounded-md" onclick={() => onSortClick?.()}>
						<SlidersHorizontal class="mr-1.5 size-4" />
						{sortButtonLabel}
					</Button>
				{/if}
				{#if showSearchInput}
					<div class="relative w-48">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder={searchPlaceholder}
							value={searchValue}
							oninput={(event) => {
								const target = event.currentTarget as HTMLInputElement | null;
								onSearchChange?.(target?.value ?? '');
							}}
							class="h-9 rounded-md pl-9"
						/>
					</div>
				{/if}
				{#if showSortIconButton}
					<button
						type="button"
						class="flex size-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						onclick={() => onSortIconClick?.()}
					>
						<SlidersHorizontal class="size-4" />
						<span class="sr-only">Sort</span>
					</button>
				{/if}
			</div>
		
	</div>
	<div class="px-6 pb-6">
		<PaginationTable showFilter={false}>
			{#if error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{error}
				</div>
			{:else if loading}
				<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
					<p class="text-muted-foreground">Loading…</p>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={columns} />
						<TableBody {rows} columns={columns} {emptyMessage} />
					</table>
				</div>

				{#if canPaginate}
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
								disabled={prevDisabled}
								onclick={() => onPageChange?.((pagination?.page ?? 1) - 1)}
							>
								Prev
							</Button>
							<span class="text-sm text-muted-foreground">
								{pagination?.page ?? 1} of {pagination?.total_pages ?? 1} pages
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={nextDisabled}
								onclick={() => onPageChange?.((pagination?.page ?? 1) + 1)}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			{/if}
		</PaginationTable>
	</div>
</section>
