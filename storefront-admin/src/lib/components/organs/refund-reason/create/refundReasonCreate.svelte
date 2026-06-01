<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';
	import { toast, Toaster } from 'svelte-sonner';
	import PaymentProviderMetadataField from '../../payment-provider/PaymentProviderMetadataField.svelte';

	let {
		open = $bindable(false),
		onSuccess = () => {}
	}: {
		open?: boolean;
		onSuccess?: () => void;
	} = $props();

	const { form, errors, enhance, delayed } = superForm(
		{
			label: '',
			value: '',
			metadata: ''
		},
		{
			resetForm: true,
			onResult: ({ result }) => {
				if (result.status === 200) {
					toast.success('Refund reason created successfully');
					open = false;
					onSuccess();
				}
			}
		}
	);

	let initialized = $state(false);

	$effect(() => {
		if (!open) {
			initialized = false;
			return;
		}

		if (initialized) return;
		initialized = true;
		$form = { label: '', value: '', metadata: '' };
	});

	function close() {
		open = false;
	}

	const title = $derived('Create Refund Reason');
	const subtitle = $derived('Add a new refund reason for refunds.');
	const submitLabel = $derived($delayed ? 'Creating...' : 'Create');
</script>

<Toaster richColors position="top-center" duration={3000} />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-lg">
		<form action="?/create" method="POST" use:enhance class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>

				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="rr-label" class="text-sm font-medium">Label</label>
						<Input
							id="rr-label"
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
						<label for="rr-value" class="text-sm font-medium">Value</label>
						<Input
							id="rr-value"
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
						id="rr-metadata"
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
