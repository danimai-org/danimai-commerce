<script lang="ts">
	import type { PageProps } from './$types';
	import { cn } from '$lib/utils.js';
	import PaymentTransactionCard from '$lib/components/organs/payment/detail/PaymentTransactionCard.svelte';
	import RefundCard from '$lib/components/organs/payment/detail/RefundCard.svelte';

	let { data }: PageProps = $props();

	function formatAmount(value: string | number | null | undefined) {
		if (value === null || value === undefined || value === '') return '-';
		const amount = Number(value);
		if (Number.isNaN(amount)) return String(value);
		return amount.toFixed(2);
	}

	function statusBadgeClass(status: string | null | undefined) {
		if (status === 'succeeded') return 'bg-green-500/10 text-green-700 dark:text-green-400';
		if (status === 'pending') return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
		if (status === 'failed') return 'bg-red-500/10 text-red-700 dark:text-red-400';
		return 'bg-muted text-muted-foreground';
	}

	function statusDotClass(status: string | null | undefined) {
		if (status === 'succeeded') return 'bg-green-600';
		if (status === 'pending') return 'bg-amber-600';
		if (status === 'failed') return 'bg-red-600';
		return 'bg-muted-foreground/60';
	}
</script>

<svelte:head>
	<title>Payment Details | Danimai Store</title>
	<meta name="description" content="View payment details, transactions, and refunds." />
</svelte:head>

<div class="flex h-full min-w-0 flex-col overflow-x-hidden">
	<div class="flex min-h-0 min-w-0 flex-1 flex-col p-4 sm:p-6">
		{#if data?.error}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{data?.error}
			</div>
		{:else if !data?.payment}
			<div class="rounded-lg border bg-card px-4 py-6">
				<p class="text-sm text-muted-foreground">Payment not found.</p>
			</div>
		{:else}
			<div class="mb-4 grid min-w-0 grid-cols-1 gap-4">
				<div class="min-w-0 self-start rounded-lg border bg-card p-4 shadow-sm sm:p-6">
					<section class="border-b pb-4">
						<div class="flex items-start justify-between gap-3">
							<h1 class="min-w-0 flex-1 text-lg font-semibold tracking-tight break-all sm:text-xl">
								Payment {data.payment?.id ?? '-'}
							</h1>
							<span
								class={cn(
									'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
									statusBadgeClass(data.payment?.last_status)
								)}
							>
								<span
									class={cn(
										'size-1.5 shrink-0 rounded-sm',
										statusDotClass(data.payment?.last_status)
									)}
									aria-hidden="true"
								></span>
								{data.payment?.last_status ?? '-'}
							</span>
						</div>
					</section>
					<dl class="mt-4 grid gap-3 text-sm">
						<div class="flex items-center justify-between gap-4">
							<dt class="shrink-0 font-medium text-muted-foreground">Amount</dt>
							<dd class="min-w-0 text-right font-semibold break-words">
								{formatAmount(data.payment?.amount)}
								{data.payment?.currency_code ?? ''}
							</dd>
						</div>
						<div class="flex items-center justify-between gap-4">
							<dt class="shrink-0 font-medium text-muted-foreground">Provider</dt>
							<dd class="min-w-0 text-right font-semibold break-words">
								{data.payment?.provider_name ?? '-'}
							</dd>
						</div>
					</dl>
				</div>
			</div>

			<div class="space-y-4">
				<PaymentTransactionCard payment={data.payment} transactions={data.transactions ?? []} />
				<RefundCard refunds={data.refunds ?? []} />
			</div>
		{/if}
	</div>
</div>
