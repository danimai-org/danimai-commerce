<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { toast, Toaster } from 'svelte-sonner';
	import { createQuery } from '@tanstack/svelte-query';
	import { client } from '$lib/client.js';
	import { createRefund } from '$lib/refunds/api.js';
	import { Combobox, type ComboboxOption } from '$lib/components/organs/index.js';
	import {
		parseMetadataFormValue,
		type PaymentProviderMetadata
	} from '$lib/payment-providers/metadata.js';
	import PaymentProviderMetadataField from '$lib/components/organs/payment-provider/PaymentProviderMetadataField.svelte';

	let {
		open = $bindable(false),
		onSuccess = () => {}
	}: {
		open?: boolean;
		onSuccess?: () => void;
	} = $props();

	let paymentTransactionId = $state('');
	let amount = $state('');
	let refundReasonId = $state('');
	let metadata = $state('');
	let submitting = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let refundReasonSearch = $state('');

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

	const refundReasonComboboxOptions = $derived.by((): ComboboxOption[] => {
		const rows = (refundReasonsQuery.data?.data?.rows ?? []) as Array<{
			id: string;
			label: string;
		}>;
		const options = rows.map((reason) => ({ id: reason.id, value: reason.label }));
		if (refundReasonSearch.trim()) return options;
		return optionsWithSelection(options, refundReasonId.trim(), '');
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

	function scheduleRefundReasonSearch(query: string) {
		refundReasonSearch = query;
	}

	let initialized = $state(false);

	$effect(() => {
		if (!open) {
			initialized = false;
			refundReasonSearch = '';
			return;
		}
		if (initialized) return;
		initialized = true;
		paymentTransactionId = '';
		amount = '';
		refundReasonId = '';
		refundReasonSearch = '';
		metadata = '';
		fieldErrors = {};
	});

	function close() {
		open = false;
	}

	function validate(): boolean {
		const errors: Record<string, string> = {};
		const txId = paymentTransactionId.trim();
		if (!txId) {
			errors.payment_transaction_id = 'Payment transaction id is required';
		} else if (
			!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(txId)
		) {
			errors.payment_transaction_id = 'Must be a valid UUID';
		}

		const amountTrimmed = amount.trim();
		if (!amountTrimmed) {
			errors.amount = 'Amount is required';
		} else if (Number.isNaN(Number(amountTrimmed)) || Number(amountTrimmed) <= 0) {
			errors.amount = 'Amount must be a positive number';
		}

		try {
			parseMetadataFormValue(metadata, 'omit');
		} catch (err) {
			errors.metadata = err instanceof Error ? err.message : 'Invalid metadata';
		}

		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!validate()) return;

		submitting = true;
		try {
			let parsedMetadata: PaymentProviderMetadata | undefined;
			try {
				parsedMetadata = parseMetadataFormValue(metadata, 'omit');
			} catch (err) {
				fieldErrors = {
					metadata: err instanceof Error ? err.message : 'Invalid metadata'
				};
				return;
			}

			await createRefund({
				payment_transaction_id: paymentTransactionId.trim(),
				amount: amount.trim(),
				...(refundReasonId.trim() ? { refund_reason_id: refundReasonId.trim() } : {}),
				...(parsedMetadata !== undefined ? { metadata: parsedMetadata } : {})
			});

			toast.success('Refund created successfully');
			open = false;
			onSuccess();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to create refund');
		} finally {
			submitting = false;
		}
	}
</script>

<Toaster richColors position="top-center" duration={3000} />
<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-lg">
		<form class="flex h-full flex-col" onsubmit={handleSubmit}>
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Refund</h2>
				<p class="mt-1 text-sm text-muted-foreground">Create a refund for a payment transaction.</p>

				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="refund-tx-id" class="text-sm font-medium">Payment transaction ID</label>
						<Input
							id="refund-tx-id"
							bind:value={paymentTransactionId}
							placeholder="UUID of the payment transaction"
							class={cn('h-9', fieldErrors.payment_transaction_id && 'border-destructive')}
						/>
						{#if fieldErrors.payment_transaction_id}
							<span class="text-xs text-destructive">{fieldErrors.payment_transaction_id}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<label for="refund-amount" class="text-sm font-medium">Amount</label>
						<Input
							id="refund-amount"
							bind:value={amount}
							type="text"
							inputmode="decimal"
							placeholder="e.g. 10.00"
							class={cn('h-9', fieldErrors.amount && 'border-destructive')}
						/>
						{#if fieldErrors.amount}
							<span class="text-xs text-destructive">{fieldErrors.amount}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<label for="refund-reason" class="text-sm font-medium">Refund reason (optional)</label>
						<Combobox
							id="refund-reason"
							bind:value={refundReasonId}
							options={refundReasonComboboxOptions}
							placeholder="Select refund reason"
							remoteOptions
							onSearchChange={scheduleRefundReasonSearch}
							loading={refundReasonsLoading}
							emptyMessage="No refund reasons found."
						/>
					</div>

					<PaymentProviderMetadataField
						id="refund-create-metadata"
						bind:value={metadata}
						error={fieldErrors.metadata}
					/>
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Creating...' : 'Create'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
