<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import FileText from '@lucide/svelte/icons/file-text';
	import ImageIcon from '@lucide/svelte/icons/image';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { resolve } from '$app/paths';
	import {
		fetchOrder,
		fetchOrderPaymentForRefund
	} from '$lib/components/organs/order/detail/load-order.js';
	import {
		formatOrderCurrency,
		getOrderItems,
		getRefundableAmount,
		type OrderDetailOrder
	} from '$lib/components/organs/order/detail/types.js';
	import { createRefund } from '$lib/refunds/api.js';

	const orderId = $derived($page.params.id);

	let order = $state<OrderDetailOrder | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let refundQuantities = $state<Record<string, number>>({});
	let reasonForRefund = $state('');
	let refundMethod = $state('original_payment');
	let manualRefundAmount = $state('');
	let sendNotification = $state(true);
	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	async function loadOrder() {
		if (!orderId) return;
		loading = true;
		error = null;
		try {
			const result = await fetchOrder(orderId);
			order = result.order;
			error = result.error;
			const items = order ? getOrderItems(order) : [];
			refundQuantities = Object.fromEntries(items.map((it) => [it.id, 0]));
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			order = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadOrder();
	});

	const orderItems = $derived(order ? getOrderItems(order) : []);
	const availableForRefund = $derived(getRefundableAmount(order, orderItems));

	const refundFromItems = $derived(
		orderItems.reduce((sum, item) => {
			const qty = refundQuantities[item.id] ?? 0;
			return sum + item.price * Math.min(qty, item.quantity);
		}, 0)
	);

	const parsedManual = $derived(parseFloat(manualRefundAmount.replace(/[^0-9.-]/g, '')) || 0);
	const effectiveRefundAmount = $derived(
		manualRefundAmount.trim() !== '' ? parsedManual : refundFromItems
	);

	const hasSelection = $derived(
		orderItems.some((item) => (refundQuantities[item.id] ?? 0) > 0) ||
			manualRefundAmount.trim() !== ''
	);

	const canSubmit = $derived(
		effectiveRefundAmount > 0 && effectiveRefundAmount <= availableForRefund
	);

	function setRefundQty(itemId: string, qty: number) {
		refundQuantities = { ...refundQuantities, [itemId]: Math.max(0, qty) };
	}

	async function submitRefund() {
		if (!orderId || !canSubmit) return;
		submitting = true;
		submitError = null;
		try {
			const payment = await fetchOrderPaymentForRefund(orderId);
			if (!payment) {
				throw new Error('No successful payment transaction found for this order.');
			}
			await createRefund({
				payment_transaction_id: payment.paymentTransactionId,
				amount: effectiveRefundAmount,
				metadata: reasonForRefund.trim()
					? { note: reasonForRefund.trim(), send_notification: sendNotification }
					: { send_notification: sendNotification }
			});
			await goto(resolve(`/orders/${orderId}`, {}));
		} catch (e) {
			submitError = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex h-full flex-col bg-muted/30">
	<div class="flex min-h-0 flex-1 flex-col">
		{#if error}
			<div class="p-4 sm:p-6">
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{error}
				</div>
			</div>
		{:else if loading}
			<div class="flex min-h-0 flex-1 items-center justify-center">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else if order}
			<div class="shrink-0 border-b bg-background px-4 py-3 sm:px-6 sm:py-4">
				<div class="flex min-w-0 items-center gap-2 sm:gap-4">
					<Button
						variant="ghost"
						size="icon"
						class="size-8 shrink-0"
						onclick={() => goto(resolve(`/orders/${orderId}`, {}))}
					>
						<ArrowLeft class="size-4" />
					</Button>
					<div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
						<FileText class="size-4 shrink-0 text-muted-foreground" />
						<span class="text-sm text-muted-foreground">></span>
						<a
							href={resolve(`/orders/${orderId}`, {})}
							class="text-lg font-semibold hover:underline">#{order.display_id}</a
						>
						<span class="text-sm text-muted-foreground">></span>
						<h1 class="text-lg font-semibold">Refund</h1>
					</div>
				</div>
			</div>

			<div
				class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-4 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]"
			>
				<div class="flex min-w-0 flex-col gap-4 sm:gap-6">
					<!-- Order items to refund -->
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-4 flex items-center gap-2">
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
							>
								Unfulfilled
							</span>
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
							>
								<MapPin class="size-3" />
								Bhopal
							</span>
						</div>
						{#if orderItems.length > 0}
							<div class="mb-4 space-y-4">
								{#each orderItems as item (item.id)}
									{@const qtyRefund = refundQuantities[item.id] ?? 0}
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
											<a href={resolve(`/products`, {})} class="font-medium hover:underline"
												>{item.title}</a
											>
											{#if item.sku}
												<div class="text-sm text-muted-foreground">
													SKU: {item.sku}
												</div>
											{/if}
											<div class="mt-1 text-sm text-muted-foreground">
												{formatOrderCurrency(item.price)} × {item.quantity}
											</div>
										</div>
										<div
											class="flex w-full shrink-0 flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end"
										>
											<Input
												type="number"
												min="0"
												max={item.quantity}
												value={qtyRefund}
												oninput={(e) =>
													setRefundQty(
														item.id,
														parseInt((e.currentTarget as HTMLInputElement).value, 10) || 0
													)}
												class="h-8 w-20 text-center"
											/>
											<span class="text-sm text-muted-foreground">
												{qtyRefund} / {item.quantity}
											</span>
											<span class="w-20 text-right text-sm font-medium">
												{formatOrderCurrency(item.price * qtyRefund)}
											</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
						<p class="text-sm text-muted-foreground">
							Refunded items will be removed from the order
						</p>
					</div>

					<!-- Reason for refund -->
					<div class="rounded-lg border bg-card p-4">
						<h3 class="mb-2 text-sm font-semibold">Reason for refund</h3>
						<textarea
							bind:value={reasonForRefund}
							rows="4"
							class="flex min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder="Enter reason (optional)"
						></textarea>
						<p class="mt-2 text-xs text-muted-foreground">
							Only you and other staff can see this reason
						</p>
					</div>
				</div>

				<div class="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
					<div class="rounded-lg border bg-card p-4">
						<h3 class="mb-2 text-sm font-semibold">Summary</h3>
						{#if !hasSelection}
							<p class="text-sm text-muted-foreground">No items selected</p>
						{:else}
							<p class="text-sm text-muted-foreground">
								Refund total: {formatOrderCurrency(effectiveRefundAmount)}
							</p>
						{/if}
					</div>

					<div class="rounded-lg border bg-card p-4">
						<h3 class="mb-2 text-sm font-semibold">Refund method</h3>
						<Select.Root
							type="single"
							value={refundMethod}
							onValueChange={(v) => v && (refundMethod = v)}
						>
							<Select.Trigger class="h-9 w-full">
								Original payment
								<ChevronDown class="ml-auto size-4 opacity-50" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="original_payment" label="Original payment"
									>Original payment</Select.Item
								>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="rounded-lg border bg-card p-4">
						<h3 class="mb-1 text-sm font-semibold">Refund amount</h3>
						<p class="mb-2 text-xs text-muted-foreground">Manual</p>
						<Input type="text" bind:value={manualRefundAmount} placeholder="₹0.00" class="h-9" />
						<p class="mt-2 text-xs text-muted-foreground">
							{formatOrderCurrency(availableForRefund)} available for refund
						</p>
					</div>

					{#if submitError}
						<div
							class="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{submitError}
						</div>
					{/if}

					<div class="rounded-lg border bg-card p-4">
						<label class="flex cursor-pointer items-center gap-2">
							<input
								type="checkbox"
								bind:checked={sendNotification}
								class="size-4 rounded border-input"
							/>
							<span class="text-sm font-medium">Send notification once refund is finalized</span>
						</label>
					</div>

					<Button class="w-full" disabled={!canSubmit || submitting} onclick={submitRefund}>
						{submitting ? 'Processing…' : `Refund ${formatOrderCurrency(effectiveRefundAmount)}`}
					</Button>
				</div>
			</div>

			<div class="shrink-0 border-t bg-background px-4 py-3 text-center sm:px-6 sm:py-4">
				<button
					type="button"
					class="cursor-pointer border-none bg-transparent text-sm text-primary hover:underline"
					>Learn more about refunding orders</button
				>
			</div>
		{/if}
	</div>
</div>
