<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EditCategorySheet from './EditCategorySheet.svelte';
	import { cn } from '$lib/utils.js';
	import { createPagination } from '$lib/api/pagination.svelte';
	import { client } from '$lib/client';
	import { createPaginationQuery } from '$lib/api/pagination.svelte';
	import type { ProductCategory } from '$lib/product-categories/types.js';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const categoryPaginateState = createPagination(
		async () => {
			return client['product-categories'].get({ query: paginationQuery });
		},
		['product-categories']
	);

	interface Props {
		onUpdated?: () => void | Promise<void>;
	}

	let { onUpdated = () => {} }: Props = $props();

	let editSheetOpen = $state(false);

	function getHandle(c: ProductCategory | null): string {
		if (!c) return '';
		return c.handle?.startsWith('/') ? c.handle : `/${c.handle ?? ''}`;
	}

	function getDescription(c: ProductCategory | null): string {
		if (!c?.metadata || typeof c.metadata !== 'object') return '—';
		const desc = (c.metadata as { description?: string }).description;
		return desc != null && desc !== '' ? String(desc) : '—';
	}

const selectedCategory = $derived.by(() => {
	const row = categoryPaginateState.query.data?.data?.rows[0];
	if (!row) return null;

	return {
		...row,
		created_at: typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString(),
		updated_at: typeof row.updated_at === 'string' ? row.updated_at : row.updated_at.toISOString(),
		deleted_at:
			row.deleted_at == null
				? null
				: typeof row.deleted_at === 'string'
					? row.deleted_at
					: row.deleted_at.toISOString()
	} as ProductCategory;
});
</script>

<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6 pb-8">
		<div class="flex items-center justify-between gap-4">
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="text-2xl font-semibold tracking-tight">{categoryPaginateState.query.data?.data?.rows[0]?.value ?? '—'}</h1>
				{#if categoryPaginateState.query.data?.data?.rows[0]}
					<span
						class={cn(
							'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
							categoryPaginateState.query.data?.data?.rows[0].visibility === 'public' &&
								'bg-green-500/10 text-green-700 dark:text-green-400',
							categoryPaginateState.query.data?.data?.rows[0].visibility === 'private' && 'bg-muted text-muted-foreground'
						)}
					>
						<span
							class={cn(
								'size-1.5 shrink-0 rounded-sm bg-current opacity-70',
								categoryPaginateState.query.data?.data?.rows[0].visibility === 'public' && 'bg-green-600',
								categoryPaginateState.query.data?.data?.rows[0].visibility === 'private' && 'bg-muted-foreground'
							)}
						></span>
						{categoryPaginateState.query.data?.data?.rows[0].visibility === 'public' ? 'Public' : 'Private'}
					</span>
				{/if}
			</div>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				onclick={() => (editSheetOpen = true)}
				aria-label="Edit category"
				disabled={!categoryPaginateState.query.data?.data?.rows[0]}
			>
				<Pencil class="size-4" />
			</Button>
		</div>
	</section>
	<div class="rounded-lg bg-card p-6">
		<dl class="mt-4 grid gap-3 text-sm">
			<div class="flex justify-between gap-4">
				<dt class="shrink-0 font-medium text-muted-foreground">Description</dt>
				<dd class="text-right">{getDescription(selectedCategory)}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="shrink-0 font-medium text-muted-foreground">Handle</dt>
				<dd class="text-right">{getHandle(selectedCategory)}</dd>
			</div>
		</dl>
	</div>
</div>

<EditCategorySheet bind:open={editSheetOpen} category={selectedCategory} onUpdated={onUpdated} />
