<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { client } from '$lib/client';
	import Package from '@lucide/svelte/icons/package';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Truck from '@lucide/svelte/icons/truck';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import ImageIcon from '@lucide/svelte/icons/image';
	import type { OrderDetailOrder, OrderFulfillmentStatus, OrderItem } from './types.js';
	import { formatOrderCurrency, fulfillmentStatusLabel, statusBadgeClass } from './types.js';

	let {
		order,
		orderId,
		orderItems,
		onOrderUpdated
	}: {
		order: OrderDetailOrder;
		orderId: string;
		orderItems: OrderItem[];
		onOrderUpdated?: () => void | Promise<void>;
	} = $props();

	let updating = $state(false);

	const itemCount = $derived(orderItems.reduce((sum, item) => sum + item.quantity, 0));
	const isInProgress = $derived(order.fulfillment_status === 'partially_fulfilled');
	const isUnfulfilled = $derived(order.fulfillment_status === 'not_fulfilled');
	const isFulfilled = $derived(order.fulfillment_status === 'fulfilled');

	async function updateFulfillmentStatus(fulfillment_status: OrderFulfillmentStatus) {
		if (updating) return;
		updating = true;
		try {
			const res = await client.orders({ id: orderId }).patch({ fulfillment_status });
			if (res.error) {
				throw new Error('Failed to update fulfillment status');
			}
			await onOrderUpdated?.();
		} catch (e) {
			console.error(e);
			alert(e instanceof Error ? e.message : 'Failed to update fulfillment status');
		} finally {
			updating = false;
		}
	}
</script>

<div class="rounded-lg border bg-card p-4">
	<div class="mb-4 flex items-center justify-between gap-2">
		<div class="flex flex-wrap items-center gap-2">
			<span class={statusBadgeClass(order.fulfillment_status)}>
				{#if isInProgress}
					<Truck class="mr-1 size-3" />
					In progress{itemCount > 0 ? ` (${itemCount})` : ''}
				{:else}
					<Package class="mr-1 size-3" />
					{fulfillmentStatusLabel(order.fulfillment_status)}
				{/if}
			</span>
			<span
				class="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
			>
				<MapPin class="size-3" />
				Shop location
			</span>
		</div>
		{#if isFulfilled}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					disabled={updating}
					class="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
				>
					<MoreHorizontal class="size-5" />
					<span class="sr-only">Fulfillment actions</span>
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						class="z-50 min-w-40 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
						sideOffset={4}
					>
						<DropdownMenu.Item
							class="relative flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm font-medium text-destructive outline-none select-none hover:bg-destructive/15 focus:bg-destructive/15"
							onSelect={() => updateFulfillmentStatus('not_fulfilled')}
						>
							Cancel fulfillment
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		{/if}
	</div>

	<div class="mb-4 rounded-md border bg-muted/20 px-3 py-2">
		<div class="mb-3 flex items-center gap-2 text-sm font-medium">
			<Truck class="size-4 text-muted-foreground" />
			Shipping
		</div>
		{#if orderItems.length > 0}
			<div class="space-y-4">
				{#each orderItems as item (item.id)}
					<div class="flex flex-wrap items-start gap-3 sm:flex-nowrap sm:gap-4">
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
							<div class="font-medium text-primary underline-offset-2 hover:underline">
								{item.title}
							</div>
							{#if item.sku}
								<div class="text-sm text-muted-foreground">SKU: {item.sku}</div>
							{/if}
							<div class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
								<span>{formatOrderCurrency(item.price)} ×</span>
								<span
									class="inline-flex min-w-7 items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
								>
									{item.quantity}
								</span>
							</div>
						</div>
						<div class="ml-auto shrink-0 font-medium sm:ml-0"
							>{formatOrderCurrency(item.price * item.quantity)}</div
						>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">No products on this order</p>
		{/if}
	</div>

	{#if !isFulfilled}
		<div class="flex justify-stretch sm:justify-end">
			{#if isUnfulfilled}
				<button
					type="button"
					disabled={updating}
					onclick={() => updateFulfillmentStatus('partially_fulfilled')}
					class="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
				>
					Mark as in progress
				</button>
			{:else}
				<div class="inline-flex w-full sm:w-auto">
					<button
						type="button"
						disabled={updating}
						onclick={() =>
							updateFulfillmentStatus(isInProgress ? 'fulfilled' : 'partially_fulfilled')}
						class="inline-flex h-9 min-w-0 flex-1 items-center justify-center rounded-l-md rounded-r-none bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50 sm:flex-none"
					>
						{isInProgress ? 'Mark as fulfilled' : 'Mark as in progress'}
					</button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							disabled={updating}
							class="inline-flex h-9 items-center justify-center rounded-l-none rounded-r-md border-l border-primary-foreground/20 bg-primary px-2 text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
						>
							<ChevronDown class="size-4" />
						</DropdownMenu.Trigger>
						<DropdownMenu.Portal>
							<DropdownMenu.Content
								class="z-50 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
							>
								{#if isInProgress}
									<DropdownMenu.Item
										class="cursor-pointer"
										onSelect={() => updateFulfillmentStatus('fulfilled')}
									>
										Mark as fulfilled
									</DropdownMenu.Item>
								{/if}
								<DropdownMenu.Item
									class="cursor-pointer"
									onSelect={() => updateFulfillmentStatus('requires_action')}
								>
									Mark as on hold
								</DropdownMenu.Item>
								<DropdownMenu.Item
									class="cursor-pointer"
									onSelect={() => updateFulfillmentStatus('not_fulfilled')}
								>
									Mark as unfulfilled
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</div>
			{/if}
		</div>
	{/if}
</div>
