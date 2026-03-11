<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Search from '@lucide/svelte/icons/search';
	import ImageIcon from '@lucide/svelte/icons/image';
	import { client } from '$lib/client.js';
	import type { Product } from '$lib/products/types.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		open?: boolean;
		categoryId: string | null;
		paginationQuery: Record<string, string | number | undefined>;
		onSuccess?: () => void | Promise<void>;
	}

	let { open = $bindable(false), categoryId, paginationQuery, onSuccess = () => {} }: Props =
		$props();

	let listData = $state<{ rows: Product[]; pagination: PaginationMeta } | null>(null);
	let sheetPage = $state(1);
	let sheetLimit = $state(20);
	let search = $state('');
	let selectedIds = $state<Set<string>>(new Set());
	let submitting = $state(false);
	let error = $state<string | null>(null);

	const list = $derived(listData?.rows ?? []);
	const pagination = $derived(listData?.pagination ?? null);
	const filtered = $derived(
		search.trim()
			? list.filter((p) =>
					p.title.toLowerCase().includes(search.trim().toLowerCase())
				)
			: list
	);
	const count = $derived(pagination?.total ?? 0);
	const totalPages = $derived(pagination?.total_pages ?? 1);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, count) : 0
	);

	async function loadList() {
		try {
			const sortDir = paginationQuery.sorting_direction ?? 'desc';
			const res = await client.products.get({
				query: {
					...paginationQuery,
					page: sheetPage,
					limit: sheetLimit,
					sorting_field: (paginationQuery.sorting_field as string) ?? 'created_at',
					sorting_direction: sortDir === 'asc' ? 'asc' : 'desc'
				} as Record<string, string | number | undefined>
			});
			const data = res.data as { data?: { rows: Product[]; pagination: PaginationMeta } };
			listData = data?.data ?? null;
		} catch {
			listData = null;
		}
	}

	$effect(() => {
		if (open) {
			selectedIds = new Set();
			sheetPage = 1;
			search = '';
			error = null;
			sheetPage;
			sheetLimit;
			paginationQuery;
			loadList();
		}
	});

	function closeSheet() {
		open = false;
		error = null;
	}

	function toggleSelection(id: string) {
		selectedIds = new Set(selectedIds);
		if (selectedIds.has(id)) selectedIds.delete(id);
		else selectedIds.add(id);
		selectedIds = new Set(selectedIds);
	}

	function toggleSelectAll() {
		if (selectedIds.size === filtered.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(filtered.map((p) => p.id));
		}
	}

	async function submit() {
		if (!categoryId) return;
		const ids = Array.from(selectedIds);
		if (ids.length === 0) {
			error = 'Select at least one product';
			return;
		}
		error = null;
		submitting = true;
		try {
			for (const productId of ids) {
				await client.products({ id: productId }).put({
					category_id: categoryId
				} as Record<string, string>);
			}
			closeSheet();
			await onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-4xl sm:max-w-4xl">
		<div class="flex h-full flex-col">
			<div class="shrink-0 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Add products</h2>
				<p class="mt-1 text-sm text-muted-foreground">Select products to add to this category.</p>
			</div>
			<div class="flex min-h-0 flex-1 flex-col">
				<div class="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
					<div class="relative w-48">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={search}
							class="h-9 rounded-md pl-9"
						/>
					</div>
				</div>
				<div class="min-h-0 flex-1 overflow-auto px-6">
					<table class="w-full text-sm">
						<thead class="sticky top-0 z-10 border-b bg-muted/50">
							<tr>
								<th class="w-10 px-4 py-3 text-left font-medium">
									<input
										type="checkbox"
										class="rounded border-muted-foreground/50"
										aria-label="Select all"
										checked={filtered.length > 0 && selectedIds.size === filtered.length}
										onchange={toggleSelectAll}
									/>
								</th>
								<th class="px-4 py-3 text-left font-medium">Product</th>
								<th class="px-4 py-3 text-left font-medium">Collection</th>
								<th class="px-4 py-3 text-left font-medium">Sales Channels</th>
								<th class="px-4 py-3 text-left font-medium">Variants</th>
								<th class="px-4 py-3 text-left font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{#if filtered.length === 0}
								<tr>
									<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
										No products to show.
									</td>
								</tr>
							{:else}
								{#each filtered as p (p.id)}
									<tr class="border-b last:border-0">
										<td class="px-4 py-3">
											<input
												type="checkbox"
												class="rounded border-muted-foreground/50"
												aria-label="Select row"
												checked={selectedIds.has(p.id)}
												onchange={() => toggleSelection(p.id)}
											/>
										</td>
										<td class="px-4 py-3">
											<div class="flex items-center gap-3">
												{#if p.thumbnail}
													<img
														src={p.thumbnail}
														alt=""
														class="size-10 shrink-0 rounded-md object-cover"
													/>
												{:else}
													<div
														class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
													>
														<ImageIcon class="size-5" />
													</div>
												{/if}
												<span class="font-medium">{p.title}</span>
											</div>
										</td>
										<td class="px-4 py-3 text-muted-foreground">
											{(p as Product & { collection?: { title?: string } }).collection?.title ?? p.category?.value ?? '—'}
										</td>
										<td class="px-4 py-3 text-muted-foreground">
											{p.sales_channels?.length
												? p.sales_channels.map((sc) => sc.name).join(', ')
												: '—'}
										</td>
										<td class="px-4 py-3 text-muted-foreground">
											{p.variant_count ?? p.variants?.length ?? 0} variant
											{(p.variant_count ?? p.variants?.length ?? 0) === 1 ? '' : 's'}
										</td>
										<td class="px-4 py-3">
											<span
												class={cn(
													'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
													p.status === 'published' &&
														'bg-green-500/10 text-green-700 dark:text-green-400',
													p.status === 'draft' && 'bg-muted text-muted-foreground',
													p.status === 'proposed' &&
														'bg-amber-500/10 text-amber-700 dark:text-amber-400',
													p.status === 'rejected' && 'bg-destructive/10 text-destructive'
												)}
											>
												<span
													class={cn(
														'size-1.5 rounded-full',
														p.status === 'published' && 'bg-green-600',
														p.status === 'draft' && 'bg-muted-foreground/60',
														p.status === 'proposed' && 'bg-amber-600',
														p.status === 'rejected' && 'bg-destructive'
													)}
												></span>
												{p.status}
											</span>
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
				{#if count > 0}
					<div class="flex items-center justify-between gap-4 border-t px-6 py-4">
						<p class="text-sm text-muted-foreground">
							{start} – {end} of {count} results
						</p>
						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={sheetPage <= 1}
								onclick={() => (sheetPage = Math.max(1, sheetPage - 1))}
							>
								Prev
							</Button>
							<span class="text-sm text-muted-foreground">
								{sheetPage} of {totalPages} pages
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={sheetPage >= totalPages}
								onclick={() => (sheetPage = Math.min(totalPages, sheetPage + 1))}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			</div>
			{#if error}
				<p class="px-6 pb-2 text-sm text-destructive">{error}</p>
			{/if}
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeSheet}>Cancel</Button>
				<Button onclick={submit} disabled={submitting}>
					{submitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
