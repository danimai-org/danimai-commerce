<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import CreditCard from '@lucide/svelte/icons/credit-card';

	let {
		orderItemsCount,
		itemCount,
		subtotal,
		discountAmount,
		shippingAmount,
		taxAmount,
		total,
		paymentDueLater = $bindable(false),
		formatCurrency,
		onOpenCreditCard,
		onOpenMarkAsPaid,
		onEnsureMarketDefaults
	}: {
		orderItemsCount: number;
		itemCount: number;
		subtotal: number;
		discountAmount: number;
		shippingAmount: number;
		taxAmount: number;
		total: number;
		paymentDueLater?: boolean;
		formatCurrency: (amount: number) => string;
		onOpenCreditCard: () => void;
		onOpenMarkAsPaid: () => void;
		onEnsureMarketDefaults: () => void;
	} = $props();
</script>

<div class="rounded-lg border bg-card p-4">
	<div class="mb-4 font-medium">Payment</div>
	{#if orderItemsCount > 0}
	<div class="space-y-2 text-sm">
		<div class="flex justify-between">
			<span class="text-muted-foreground">
				Subtotal ({itemCount}
				{itemCount === 1 ? 'item' : 'items'})
			</span>
			<span class="font-medium">{formatCurrency(subtotal)}</span>
		</div>
		<button
			type="button"
			class="flex w-full justify-between text-muted-foreground transition-colors hover:text-foreground"
		>
			<span>Add discount</span>
			<span>{discountAmount === 0 ? '—' : formatCurrency(discountAmount)}</span>
		</button>
		<button
			type="button"
			class="flex w-full justify-between text-muted-foreground transition-colors hover:text-foreground"
		>
			<span>Add shipping or delivery</span>
			<span>{shippingAmount === 0 ? '—' : formatCurrency(shippingAmount)}</span>
		</button>
		{#if taxAmount > 0}
			<div class="flex justify-between">
				<span class="text-muted-foreground">Taxes</span>
				<div class="text-right">
					<div class="text-xs text-muted-foreground">CGST 9%</div>
					<div class="font-medium">{formatCurrency(taxAmount)}</div>
				</div>
			</div>
		{/if}
		<div class="border-t pt-2">
			<div class="flex justify-between font-semibold">
				<span>Total</span>
				<span>{formatCurrency(total)}</span>
			</div>
		</div>
		<div class="flex justify-between">
			<span class="text-muted-foreground">Paid</span>
			<span class="font-medium">{formatCurrency(0)}</span>
		</div>
	</div>
	{/if}

	{#if orderItemsCount > 0}
		<div class="mt-4 flex flex-col gap-3">
			<label class="flex items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={paymentDueLater} class="rounded border-input" />
				<span>Payment due later</span>
			</label>
			{#if !paymentDueLater}
				<div class="flex flex-row justify-end gap-2">
					<Button variant="outline" size="sm" class="h-9">Send invoice</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
						>
							Collect payment
							<ChevronDown class="size-4" />
						</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content
							class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
						>
							<DropdownMenu.Item
								class="flex cursor-pointer items-center gap-2"
								onSelect={onOpenCreditCard}
							>
								<CreditCard class="size-4" />
								Credit card
							</DropdownMenu.Item>
							<DropdownMenu.Item
								class="cursor-pointer"
								onSelect={() => {
									onEnsureMarketDefaults();
									onOpenMarkAsPaid();
								}}
							>
								Mark as paid
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</div>
			{/if}
		</div>
	{:else}
		<p class="mt-4 text-xs text-muted-foreground">
			Add a product to calculate total and view payment options
		</p>
	{/if}
</div>
