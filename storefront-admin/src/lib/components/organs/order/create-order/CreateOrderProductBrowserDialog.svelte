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
	import { statusBadgeClass, type Pagination, type Product } from './types.js';

	let {
		open = $bindable(false),
		search = $bindable(''),
		page = $bindable(1),
		loading,
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
		products: Product[];
		selectedProductIds: string[];
		pagination: Pagination;
		rangeStart: number;
		rangeEnd: number;
		onToggleProduct: (productId: string) => void;
		onClose: () => void;
		onAddSelected: () => void;
	} = $props();
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
			{#if loading}
				<div class="flex items-center justify-center py-12">
					<p class="text-sm text-muted-foreground">Loading…</p>
				</div>
			{:else}
				<div class="overflow-x-auto rounded-lg border bg-card">
					<table class="w-full min-w-[280px] text-sm">
						<thead class="sticky top-0 border-b bg-muted/50">
							<tr>
								<th class="w-10 px-3 py-3 text-left font-medium sm:px-4"></th>
								<th class="px-3 py-3 text-left font-medium sm:px-4">Product</th>
								<th class="hidden px-4 py-3 text-left font-medium md:table-cell">Status</th>
							</tr>
						</thead>
						<tbody>
							{#if products.length === 0}
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
												checked={selectedProductIds.includes(product.id)}
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
										<td class="hidden px-4 py-3 text-muted-foreground md:table-cell">
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
			{/if}
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
				<Button variant="outline" onclick={onClose}>Cancel</Button>
				<Button onclick={onAddSelected} disabled={selectedProductIds.length === 0}>
					Add {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''}
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
