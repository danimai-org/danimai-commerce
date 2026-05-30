<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Search from '@lucide/svelte/icons/search';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ImageIcon from '@lucide/svelte/icons/image';
	import {
		orderDialogFooterActions,
		orderDialogFooterBetween,
		orderDialogHeader,
		orderDialogScrollArea,
		orderDialogTitle,
		orderDialogToolbar,
		orderDialogXl
	} from '../dialog-classes.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';
	import { statusBadgeClass } from '../detail/types.js';
	import {
		PRODUCT_BROWSER_SKELETON_ROWS,
		type Pagination,
		type Product
	} from './types.js';

	let {
		open = $bindable(false),
		search = $bindable(''),
		page = $bindable(1),
		loading,
		adding = false,
		products,
		selectedProductIds,
		pagination,
		rangeStart,
		rangeEnd,
		onToggleProduct,
		onClose,
		onAddSelected
	}: {
		open?: boolean;
		search?: string;
		page?: number;
		loading: boolean;
		adding?: boolean;
		products: Product[];
		selectedProductIds: Set<string> | string[];
		pagination: Pagination;
		rangeStart: number;
		rangeEnd: number;
		onToggleProduct: (productId: string) => void;
		onClose: () => void;
		onAddSelected: () => void | Promise<void>;
	} = $props();

	const showSkeleton = $derived(loading && products.length === 0);
	const isRefreshing = $derived(loading && products.length > 0);
	const selectedProductIdSet = $derived.by(() => {
		if (selectedProductIds instanceof Set) return selectedProductIds;
		if (Array.isArray(selectedProductIds)) return new Set(selectedProductIds);
		return new Set<string>();
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class={orderDialogXl}>
		<Dialog.Header class={orderDialogHeader}>
			<Dialog.Title class={orderDialogTitle}>Select Products</Dialog.Title>
		</Dialog.Header>
		<div class="{orderDialogToolbar} flex flex-col gap-2">
			<Button
				variant="outline"
				size="sm"
				class="h-9 shrink-0 rounded-md max-sm:w-9 max-sm:justify-center max-sm:gap-0 max-sm:px-0 sm:min-h-9"
				aria-label="Add filter"
				title="Add filter"
			>
				<SlidersHorizontal class="size-4 shrink-0 sm:mr-1.5" />
				<span class="hidden sm:inline">Add filter</span>
			</Button>
			<div class="flex min-w-0 flex-1 items-center gap-2 sm:w-auto sm:flex-none">
				<div class="relative w-full min-w-0 flex-1 sm:w-64 sm:flex-none">
					<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search products"
						bind:value={search}
						class="h-9 w-full min-w-0 pl-9"
					/>
				</div>
				<button
					type="button"
					class="flex size-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Sort"
				>
					<ArrowUpDown class="size-4" />
					<span class="sr-only">Sort</span>
				</button>
			</div>
		</div>
		<div class={orderDialogScrollArea}>
			<div
				class={cn(
					'-mx-4 overflow-x-auto rounded-lg border bg-card sm:mx-0',
					isRefreshing && 'pointer-events-none opacity-60'
				)}
			>
				<table class="w-full min-w-[32rem] text-sm">
					<thead class="sticky top-0 z-10 border-b bg-muted/50">
						<tr>
							<th class="w-10 px-3 py-3 text-left font-medium sm:px-4"></th>
							<th class="min-w-[12rem] px-3 py-3 text-left font-medium sm:px-4">Product</th>
							<th class="w-28 px-3 py-3 text-left font-medium sm:px-4">Status</th>
						</tr>
					</thead>
					<tbody>
						{#if showSkeleton}
							{#each [...Array(PRODUCT_BROWSER_SKELETON_ROWS).keys()] as rowIndex (rowIndex)}
								<tr class="border-b last:border-b-0">
									<td class="px-3 py-3 sm:px-4">
										<Skeleton class="size-4 rounded" />
									</td>
									<td class="px-3 py-3 sm:px-4">
										<div class="flex items-center gap-3">
											<Skeleton class="size-10 shrink-0 rounded-md" />
											<Skeleton class="h-4 w-40 max-w-full" />
										</div>
									</td>
									<td class="px-3 py-3 sm:px-4">
										<Skeleton class="h-5 w-16 rounded-full" />
									</td>
								</tr>
							{/each}
						{:else if products.length === 0}
							<tr>
								<td colspan="3" class="px-4 py-8 text-center text-muted-foreground"
									>No products found.</td
								>
							</tr>
						{:else}
							{#each products as product (product.id)}
								<tr
									class="cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/30"
									role="button"
									tabindex="0"
									onclick={() => onToggleProduct(product.id)}
									onkeydown={(e) => e.key === 'Enter' && onToggleProduct(product.id)}
								>
									<td class="px-3 py-3 sm:px-4" onclick={(e) => e.stopPropagation()}>
										<input
											type="checkbox"
											checked={selectedProductIdSet.has(product.id)}
											class="size-4 rounded border-input"
											tabindex="-1"
											onclick={(e) => e.stopPropagation()}
											onchange={() => onToggleProduct(product.id)}
										/>
									</td>
									<td class="px-3 py-3 sm:px-4">
										<div class="flex min-w-0 items-center gap-3">
											{#if product.thumbnail}
												<img
													src={product.thumbnail}
													alt=""
													loading="lazy"
													decoding="async"
													class="size-10 shrink-0 rounded-md object-cover"
												/>
											{:else}
												<div
													class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
												>
													<ImageIcon class="size-5" />
												</div>
											{/if}
											<span class="min-w-0 truncate font-medium">{product.title}</span>
										</div>
									</td>
									<td class="px-3 py-3 whitespace-nowrap sm:px-4">
										<span class={statusBadgeClass(product.status)}
											>{product.status.replace(/_/g, ' ')}</span
										>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
		<Dialog.Footer class={orderDialogFooterBetween}>
			<div class="flex w-full flex-col gap-3 sm:w-auto">
				<div class="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!pagination.has_previous_page}
						onclick={() => (page = page - 1)}>Prev</Button
					>
					<span class="text-sm text-muted-foreground"
						>{pagination.page} of {pagination.total_pages} pages</span
					>
					<Button
						variant="outline"
						size="sm"
						disabled={!pagination.has_next_page}
						onclick={() => (page = page + 1)}>Next</Button
					>
				</div>
				<p class="text-sm text-muted-foreground">
					{#if pagination.total > 0}
						{rangeStart} – {rangeEnd} of {pagination.total} results
					{:else}
						0 results
					{/if}
				</p>
			</div>
			<div class={orderDialogFooterActions}>
				<Button variant="outline" onclick={onClose} disabled={adding}>Cancel</Button>
				<Button
					type="button"
					onpointerdown={(e) => {
						if (adding) e.preventDefault();
					}}
					onclick={() => {
						if (adding) return;
						void onAddSelected();
					}}
					disabled={adding || selectedProductIdSet.size === 0}
					aria-busy={adding}
				>
					{#if adding}
						<span
							class="mr-2 inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
						></span>
						Adding…
					{:else}
						Add {selectedProductIdSet.size > 0 ? `(${selectedProductIdSet.size})` : ''}
					{/if}
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
