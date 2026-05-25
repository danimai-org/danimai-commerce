<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageProps } from './$types';
	import { OrderDetailContent } from '$lib/components/organs/order/detail/index.js';

	let { data }: PageProps = $props();

	const orderId = $derived($page.params.id);

	async function loadOrder() {
		if (orderId) await invalidate(`order:${orderId}`);
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col">
		{#if data.orderLoad.error}
			<div class="p-6">
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{data.orderLoad.error}
				</div>
			</div>
		{:else if data.orderLoad.order && orderId}
			<OrderDetailContent
				order={data.orderLoad.order}
				{orderId}
				customer={data.customer}
				onOrderUpdated={loadOrder}
			/>
		{:else}
			<div class="flex min-h-0 flex-1 items-center justify-center">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{/if}
	</div>
</div>
