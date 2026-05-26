<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { DropdownMenu } from 'bits-ui';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import FileText from '@lucide/svelte/icons/file-text';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import type { OrderDetailOrder } from './types.js';
	import { formatOrderDateTime, fulfillmentStatusLabel } from './types.js';

	let {
		order,
		orderId
	}: {
		order: OrderDetailOrder;
		orderId: string;
	} = $props();

	const menuItemClass = 'cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent';
</script>

<div class="shrink-0 border-b bg-background px-4 py-3 sm:px-6 sm:py-4">
	<div class="flex flex-col gap-3">
		<div class="flex min-w-0 items-start justify-between gap-3">
			<div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
				<Button
					variant="ghost"
					size="icon"
					class="size-8 shrink-0"
					onclick={() => goto(resolve('/orders', {}))}
				>
					<ArrowLeft class="size-4" />
				</Button>
				<div class="flex min-w-0 items-center gap-2">
					<FileText class="size-4 shrink-0 text-muted-foreground" />
					<span class="shrink-0 text-sm text-muted-foreground">></span>
					<h1 class="truncate text-lg font-semibold">#{order.display_id}</h1>
				</div>
			</div>

			<!-- Mobile actions -->
			<div class="shrink-0 lg:hidden">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="inline-flex size-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
					>
						<MoreHorizontal class="size-4" />
						<span class="sr-only">Actions</span>
					</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content
							class="z-50 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
						>
							<DropdownMenu.Item
								class={menuItemClass}
								onSelect={() => goto(resolve(`/orders/${orderId}/refund`, {}))}
							>
								Refund
							</DropdownMenu.Item>
							<DropdownMenu.Item
								class={menuItemClass}
								onSelect={() => goto(resolve(`/orders/${orderId}/edit`, {}))}
							>
								Edit
							</DropdownMenu.Item>
							<DropdownMenu.Item class={menuItemClass}>Print invoice</DropdownMenu.Item>
							<DropdownMenu.Item class={menuItemClass}>Print packing slip</DropdownMenu.Item>
							<DropdownMenu.Item class={menuItemClass}>Archive order</DropdownMenu.Item>
							<DropdownMenu.Item class={menuItemClass}>Cancel order</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			</div>

			<!-- Desktop actions -->
			<div class="hidden shrink-0 items-center gap-2 lg:flex">
				<Button
					variant="outline"
					size="sm"
					onclick={() => goto(resolve(`/orders/${orderId}/refund`, {}))}>Refund</Button
				>
				<Button
					variant="outline"
					size="sm"
					onclick={() => goto(resolve(`/orders/${orderId}/edit`, {}))}>Edit</Button
				>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
					>
						Print
						<ChevronDown class="ml-1 size-4" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content
							class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
						>
							<DropdownMenu.Item class={menuItemClass}>Print invoice</DropdownMenu.Item>
							<DropdownMenu.Item class={menuItemClass}>Print packing slip</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
					>
						More actions
						<ChevronDown class="ml-1 size-4" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content
							class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
						>
							<DropdownMenu.Item class={menuItemClass}>Archive order</DropdownMenu.Item>
							<DropdownMenu.Item class={menuItemClass}>Cancel order</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
				<div class="hidden flex-col sm:flex">
					<Button variant="ghost" size="icon" class="size-6">
						<ArrowUp class="size-3" />
					</Button>
					<Button variant="ghost" size="icon" class="size-6">
						<ArrowDown class="size-3" />
					</Button>
				</div>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-2 pl-10 sm:pl-12">
			{#if order.payment_status === 'captured'}
				<span class="inline-flex items-center gap-1.5">
					<span class="size-2 rounded-full bg-emerald-500"></span>
					<span class="text-sm font-medium">Paid</span>
				</span>
			{/if}
			{#if order.fulfillment_status === 'not_fulfilled'}
				<span
					class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
				>
					<span class="size-2 rounded-full bg-amber-500"></span>
					Unfulfilled
				</span>
			{:else if order.fulfillment_status === 'partially_fulfilled'}
				<span
					class="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400"
				>
					<span class="size-2 rounded-full bg-blue-500"></span>
					{fulfillmentStatusLabel(order.fulfillment_status)}
				</span>
			{:else if order.fulfillment_status === 'fulfilled'}
				<span
					class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
				>
					<span class="size-2 rounded-full bg-emerald-500"></span>
					Fulfilled
				</span>
			{/if}
		</div>

		<p class="pl-10 text-sm text-muted-foreground sm:pl-12">
			{formatOrderDateTime(order.created_at)} from Draft Orders
		</p>
	</div>
</div>
