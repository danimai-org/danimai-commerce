<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { toast, Toaster } from 'svelte-sonner';
	import { createQuery } from '@tanstack/svelte-query';
	import { client } from '$lib/client.js';
	import { metadataToString } from '$lib/payment-providers/metadata.js';
	import PaymentProviderMetadataField from '$lib/components/organs/payment-provider/PaymentProviderMetadataField.svelte';
import { Combobox, type ComboboxOption } from '$lib/components/organs/index.js';
import { cn } from '$lib/utils.js';

	type RefundStatus = 'pending' | 'failed' | 'succeeded' | 'cancelled';

	type Refund = {
		id: string;
		payment_id: string;
		payment_transaction_id: string;
		customer_id: string;
		amount: string;
		last_status: RefundStatus;
		refund_reason_id: string | null;
		refund_reason_label?: string | null;
		metadata?: unknown;
	};

	let statusSearch = $state('');
	let refundReasonSearch = $state('');

	let {
		open = $bindable(false),
		refund = null as Refund | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		refund?: Refund | null;
		onSuccess?: () => void;
	} = $props();

	const { form, errors, enhance, delayed } = superForm(
		{
			id: '',
			last_status: 'pending' as RefundStatus,
			refund_reason_id: '',
			metadata: ''
		},
		{
			resetForm: false,
			onResult: ({ result }) => {
				if (result.status === 200) {
					toast.success('Refund updated successfully');
					open = false;
					onSuccess();
				}
			}
		}
	);

	const statusOptionsQuery = createQuery(() => ({
		queryKey: ['refund-statuses', statusSearch],
		queryFn: () =>
			client.refunds.statuses.get({
				query: {
					...(statusSearch.trim() ? { search: statusSearch.trim() } : {})
				}
			}),
		enabled: open,
		refetchOnWindowFocus: false
	}));

	const refundReasonsQuery = createQuery(() => ({
		queryKey: ['refund-reasons', 'options', refundReasonSearch],
		queryFn: () =>
			client['refund-reasons'].get({
				query: {
					page: 1,
					limit: 100,
					...(refundReasonSearch.trim() ? { search: refundReasonSearch.trim() } : {})
				}
			}),
		enabled: open,
		refetchOnWindowFocus: false
	}));

	const statusComboboxOptions = $derived.by((): ComboboxOption[] => {
		const rows = (statusOptionsQuery.data?.data ?? []) as Array<{
			id: string;
			label: string;
		}>;
		const options = rows.map((status) => ({ id: status.id, value: status.label }));
		if (statusSearch.trim()) return options;
		return optionsWithSelection(options, $form.last_status?.trim() ?? '', '');
	});

	const statusLoading = $derived(
		statusOptionsQuery.isFetching && statusComboboxOptions.length === 0
	);

	const refundReasonComboboxOptions = $derived.by((): ComboboxOption[] => {
		const rows = (refundReasonsQuery.data?.data?.rows ?? []) as Array<{
			id: string;
			label: string;
		}>;
		const options = rows.map((reason) => ({ id: reason.id, value: reason.label }));
		if (refundReasonSearch.trim()) return options;
		return optionsWithSelection(
			options,
			$form.refund_reason_id?.trim() ?? '',
			refund?.refund_reason_label ?? ''
		);
	});

	const refundReasonsLoading = $derived(
		refundReasonsQuery.isFetching && refundReasonComboboxOptions.length === 0
	);

	function optionsWithSelection(
		options: ComboboxOption[],
		selectedId: string,
		selectedLabel: string
	): ComboboxOption[] {
		if (!selectedId || options.some((option) => option.id === selectedId)) {
			return options;
		}
		const label = selectedLabel.trim() || selectedId;
		return [{ id: selectedId, value: label }, ...options];
	}

	function scheduleStatusSearch(query: string) {
		statusSearch = query;
	}

	function scheduleRefundReasonSearch(query: string) {
		refundReasonSearch = query;
	}

	let initializedForId = $state<string | null>(null);

	$effect(() => {
		if (!open) {
			initializedForId = null;
			statusSearch = '';
			refundReasonSearch = '';
			return;
		}

		const nextId = refund?.id;
		if (!nextId || initializedForId === nextId) return;
		initializedForId = nextId;

		$form = {
			id: nextId,
			last_status: refund.last_status ?? 'pending',
			refund_reason_id: refund.refund_reason_id ?? '',
			metadata: metadataToString(refund.metadata) || ''
		};
		statusSearch = '';
		refundReasonSearch = '';
	});

	function close() {
		open = false;
	}
</script>

<Toaster richColors position="top-center" duration={3000} />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-lg">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<input type="hidden" name="last_status" bind:value={$form.last_status} />
			<input type="hidden" name="refund_reason_id" bind:value={$form.refund_reason_id} />

			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Refund</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update refund status, reason, or metadata.</p>

				{#if refund}
					<dl class="mt-4 grid grid-cols-1 gap-2 rounded-md border bg-muted/30 p-3 text-xs">
						<div>
							<dt class="text-muted-foreground">Payment</dt>
							<dd class="font-mono">{refund.payment_id}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Transaction</dt>
							<dd class="font-mono">{refund.payment_transaction_id}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Amount</dt>
							<dd>{refund.amount}</dd>
						</div>
					</dl>
				{/if}

				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="refund-status" class="text-sm font-medium">Status</label>
						<Combobox
							id="refund-status"
							bind:value={$form.last_status}
							options={statusComboboxOptions}
							placeholder="Select status"
							remoteOptions
							onSearchChange={scheduleStatusSearch}
							loading={statusLoading}
							class={cn(
								'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
								$errors.last_status && 'border-destructive'
							)}
							emptyMessage="No status found."
						/>
						{#if $errors.last_status}
							<span class="text-xs text-destructive">{$errors.last_status}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<label for="refund-edit-reason" class="text-sm font-medium">Refund reason</label>
						<Combobox
							id="refund-edit-reason"
							bind:value={$form.refund_reason_id}
							options={refundReasonComboboxOptions}
							placeholder="Select refund reason"
							remoteOptions
							onSearchChange={scheduleRefundReasonSearch}
							loading={refundReasonsLoading}
							emptyMessage="No refund reasons found."
						/>
					</div>

					<PaymentProviderMetadataField
						id="refund-edit-metadata"
						bind:value={$form.metadata}
						error={$errors.metadata?.[0]}
					/>
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
