<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';
	import { toast, Toaster } from 'svelte-sonner';
	import { metadataToString } from '$lib/payment-providers/metadata.js';
	import PaymentProviderMetadataField from '../../payment-provider/PaymentProviderMetadataField.svelte';

	type RefundReason = {
		id: string;
		label: string;
		value: string;
		metadata?: unknown;
	};

	let {
		open = $bindable(false),
		reason = null as RefundReason | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		reason?: RefundReason | null;
		onSuccess?: () => void;
	} = $props();

	const { form, errors, enhance, delayed } = superForm(
		{
			id: '',
			label: '',
			value: '',
			metadata: ''
		},
		{
			resetForm: false,
			onResult: ({ result }) => {
				if (result.status === 200) {
					toast.success('Refund reason updated successfully');
					open = false;
					onSuccess();
				}
			}
		}
	);

	let initializedForId = $state<string | null>(null);

	$effect(() => {
		if (!open) {
			initializedForId = null;
			return;
		}

		const nextId = reason?.id;
		if (!nextId || initializedForId === nextId) return;
		initializedForId = nextId;

		$form = {
			id: nextId,
			label: reason.label ?? '',
			value: reason.value ?? '',
			metadata: metadataToString(reason.metadata) || ''
		};
	});

	function close() {
		open = false;
	}

	const title = $derived('Edit Refund Reason');
	const subtitle = $derived('Update refund reason details.');
	const submitLabel = $derived($delayed ? 'Saving...' : 'Save');
</script>

<Toaster richColors position="top-center" duration={3000} />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-lg">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />

			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>

				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="rr-edit-label" class="text-sm font-medium">Label</label>
						<Input
							id="rr-edit-label"
							name="label"
							bind:value={$form.label}
							placeholder="e.g. Defective product"
							aria-invalid={$errors.label ? 'true' : undefined}
							class={cn('h-9', $errors.label && 'border-destructive')}
						/>
						{#if $errors.label}
							<span class="text-xs text-destructive">{$errors.label}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<label for="rr-edit-value" class="text-sm font-medium">Value</label>
						<Input
							id="rr-edit-value"
							name="value"
							bind:value={$form.value}
							placeholder="e.g. defective_product"
							aria-invalid={$errors.value ? 'true' : undefined}
							class={cn('h-9', $errors.value && 'border-destructive')}
						/>
						{#if $errors.value}
							<span class="text-xs text-destructive">{$errors.value}</span>
						{/if}
						<p class="text-xs text-muted-foreground">
							Internal code used by the system. Must be unique.
						</p>
					</div>

					<PaymentProviderMetadataField
						id="rr-edit-metadata"
						bind:value={$form.metadata}
						error={$errors.metadata?.[0]}
					/>
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>{submitLabel}</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
