<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Package from '@lucide/svelte/icons/package';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import { statusBadgeClass } from '../detail/types.js';
	import type { CreateOrderItem } from './types.js';

	let {
		productSearch = $bindable(''),
		orderItems,
		formatCurrency,
		onBrowse,
		onRemoveItem,
		onUpdateQuantity
	}: {
		productSearch?: string;
		orderItems: CreateOrderItem[];
		formatCurrency: (amount: number) => string;
		onBrowse: () => void;
		onRemoveItem: (id: string) => void;
		onUpdateQuantity: (id: string, quantity: number) => void;
	} = $props();
</script>

<div class="rounded-lg border bg-card p-4">
	<div class="mb-4 flex items-center gap-2">
		<span class={statusBadgeClass('not_fulfilled')}>
			<Package class="mr-1 size-3" />
			Unfulfilled
		</span>
		<span
			class="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
		>
			<MapPin class="size-3" />
			Shop location
		</span>
	</div>
	<div class="mb-4 text-sm font-medium">Shipping</div>

	{#if orderItems.length === 0}
		<div class="mb-4 flex flex-col gap-3">
			<div class="relative">
				<Search
					class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="search"
					placeholder="Search products"
					bind:value={productSearch}
					class="h-9 rounded-md pl-9"
				/>
			</div>
			<div class="flex flex-col gap-2 min-[420px]:flex-row">
				<Button variant="outline" size="sm" class="min-[420px]:flex-1" onclick={onBrowse}>
					Browse
				</Button>
				<Button variant="outline" size="sm" class="min-[420px]:flex-1">Add custom item</Button>
			</div>
		</div>
	{:else}
		<div class="mb-4 space-y-4">
			{#each orderItems as item, i (item.id + '-' + i)}
				<div class="flex items-start gap-4">
					{#if item.thumbnail}
						<img
							src={item.thumbnail}
							alt={item.title}
							class="size-16 shrink-0 rounded-md object-cover"
						/>
					{:else}
						<div
							class="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
						>
							<ImageIcon class="size-6" />
						</div>
					{/if}
					<div class="min-w-0 flex-1">
						<div class="font-medium">{item.title}</div>
						<div class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
							<span>{formatCurrency(item.price)} ×</span>
							<input
								type="number"
								min="1"
								value={item.quantity}
								oninput={(e) =>
									onUpdateQuantity(item.id, Number((e.currentTarget as HTMLInputElement).value))}
								class="h-6 w-10 rounded-md border-0 bg-muted px-1.5 text-center text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
						</div>
					</div>
					<div class="flex items-start gap-2">
						<span class="font-medium">{formatCurrency(item.price * item.quantity)}</span>
						<button
							type="button"
							onclick={() => onRemoveItem(item.id)}
							class="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="Remove item"
						>
							<X class="size-4" />
						</button>
					</div>
				</div>
			{/each}
		</div>
		<div class="mt-4 flex flex-col gap-2 min-[420px]:flex-row">
			<Button variant="outline" size="sm" class="min-[420px]:flex-1" onclick={onBrowse}>
				Browse
			</Button>
			<Button variant="outline" size="sm" class="min-[420px]:flex-1">Add custom item</Button>
		</div>
	{/if}
</div>
