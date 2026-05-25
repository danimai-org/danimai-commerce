<script lang="ts">
	import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
	import type { OrderDetailOrder } from './types.js';
	import { formatOrderCurrency } from './types.js';

	let {
		order,
		subtotal,
		taxAmount,
		total,
		paidAmount,
		itemCount
	}: {
		order: OrderDetailOrder;
		subtotal: number;
		taxAmount: number;
		total: number;
		paidAmount: number;
		itemCount: number;
	} = $props();
</script>

<div class="rounded-lg border bg-card p-4">
	<div class="mb-4 flex items-center gap-2">
		<CheckCircle2 class="size-4 text-emerald-600" />
		<span class="font-medium">{order.payment_status === 'captured' ? 'Paid' : 'Payment'}</span>
	</div>
	<div class="space-y-2 text-sm">
		<div class="flex justify-between">
			<span class="text-muted-foreground">
				Subtotal ({itemCount}
				{itemCount === 1 ? 'item' : 'items'})
			</span>
			<span class="font-medium">{formatOrderCurrency(subtotal)}</span>
		</div>
		{#if taxAmount > 0}
			<div class="flex justify-between">
				<div class="flex items-center gap-1">
					<span class="text-muted-foreground">Taxes</span>
				</div>
				<div class="text-right">
					<div class="text-xs text-muted-foreground">CGST 9%</div>
					<div class="font-medium">{formatOrderCurrency(taxAmount)}</div>
				</div>
			</div>
		{/if}
		<div class="border-t pt-2">
			<div class="flex justify-between text-sm font-semibold">
				<span>Total</span>
				<span>{formatOrderCurrency(total)}</span>
			</div>
		</div>
		<div class="flex justify-between text-sm">
			<span class="text-muted-foreground">Paid</span>
			<span class="font-medium">{formatOrderCurrency(paidAmount)}</span>
		</div>
	</div>
</div>
