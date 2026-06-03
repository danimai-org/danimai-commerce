<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';
	import { toast, Toaster } from 'svelte-sonner';
	import { metadataToString } from '$lib/payment-providers/metadata.js';
	import PaymentProviderMetadataField from '../PaymentProviderMetadataField.svelte';

	type PaymentProvider = {
		id: string;
		name: string;
		active: boolean;
		metadata?: unknown;
	};

	let {
		open = $bindable(false),
		provider = null as PaymentProvider | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		provider?: PaymentProvider | null;
		onSuccess?: () => void;
	} = $props();

	const { form, errors, enhance, delayed } = superForm(
		{
			id: '',
			name: '',
			active: true,
			metadata: ''
		},
		{
			resetForm: false,
			onResult: ({ result }) => {
				if (result.status === 200) {
					toast.success('Payment provider updated successfully');
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

		const nextId = provider?.id;
		if (!nextId || initializedForId === nextId) return;
		initializedForId = nextId;

		$form = {
			id: nextId,
			name: provider.name ?? '',
			active: provider.active ?? true,
			metadata: metadataToString(provider.metadata) || ''
		};
	});

	function close() {
		open = false;
	}

	const title = $derived('Edit Payment Provider');
	const subtitle = $derived('Update payment provider details.');
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
						<label for="pp-edit-name" class="text-sm font-medium">Name</label>
						<Input
							id="pp-edit-name"
							name="name"
							bind:value={$form.name}
							placeholder="e.g. Stripe"
							aria-invalid={$errors.name ? 'true' : undefined}
							class={cn('h-9', $errors.name && 'border-destructive')}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>

					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="pp-edit-active"
							name="active"
							bind:checked={$form.active}
							class="h-4 w-4 rounded border-input"
						/>
						<label for="pp-edit-active" class="text-sm font-medium">Active</label>
					</div>

					<PaymentProviderMetadataField
						id="pp-edit-metadata"
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
