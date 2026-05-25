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
	import type { OrderDetailOrder } from './types.js';
	import { formatOrderDateTime, fulfillmentStatusLabel } from './types.js';

	let {
		order,
		orderId
	}: {
		order: OrderDetailOrder;
		orderId: string;
	} = $props();
</script>

<div class="border-b bg-background px-6 py-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button
				variant="ghost"
				size="icon"
				class="size-8"
				onclick={() => goto(resolve('/orders', {}))}
			>
				<ArrowLeft class="size-4" />
			</Button>
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<FileText class="size-4 text-muted-foreground" />
					<span class="text-sm text-muted-foreground">></span>
					<h1 class="text-lg font-semibold">#{order.display_id}</h1>
				</div>
				<div class="flex items-center gap-2">
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
			</div>
		</div>
		<div class="flex items-center gap-2">
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
						<DropdownMenu.Item class="cursor-pointer">Print invoice</DropdownMenu.Item>
						<DropdownMenu.Item class="cursor-pointer">Print packing slip</DropdownMenu.Item>
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
						<DropdownMenu.Item class="cursor-pointer">Archive order</DropdownMenu.Item>
						<DropdownMenu.Item class="cursor-pointer">Cancel order</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
			<div class="flex flex-col">
				<Button variant="ghost" size="icon" class="size-6">
					<ArrowUp class="size-3" />
				</Button>
				<Button variant="ghost" size="icon" class="size-6">
					<ArrowDown class="size-3" />
				</Button>
			</div>
		</div>
	</div>
	<div class="mt-2 text-sm text-muted-foreground">
		{formatOrderDateTime(order.created_at)} from Draft Orders
	</div>
</div>
