<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { cn } from '$lib/utils.js';
	import { Toaster } from 'svelte-sonner';
	import { toast } from 'svelte-sonner';
	import type { InventoryItemEntity } from '../type.js';

	type InventoryItemUpdateFormData = {
		id: string;
		sku: string;
		requires_shipping: boolean;
	};

	let {
		open = $bindable(false),
		item = null as InventoryItemEntity | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		item?: InventoryItemEntity | null;
		onSuccess?: () => void | Promise<void>;
	} = $props();

	let apiError = $state<string | null>(null);

	const { form, errors, enhance, delayed, reset } = superForm(
		page.data.inventoryItemUpdateForm as SuperValidated<InventoryItemUpdateFormData>,
		{
			resetForm: false,
			invalidateAll: false,
			onResult: async ({ result }) => {
				if (result.type === 'failure') {
					const d = result.data as { error?: string } | undefined;
					apiError = d?.error ?? null;
					return;
				}
				if (result.type === 'error') {
					apiError =
						result.error instanceof Error
							? result.error.message
							: String(result.error ?? 'Something went wrong');
					return;
				}
				if (result.type === 'success') {
					apiError = null;
					open = false;
					toast.success('Inventory item updated successfully');
					await onSuccess();
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
		if (!item) return;
		if (initializedForId === item.id) return;
		initializedForId = item.id;
		apiError = null;
		reset({
			data: {
				id: item.id,
				sku: item.sku ?? '',
				requires_shipping: item.requires_shipping ?? true
			}
		});
	});

	function close() {
		if (!$delayed) open = false;
	}

	function onOpenChange(isOpen: boolean) {
		if (!isOpen) {
			apiError = null;
		}
	}
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open {onOpenChange}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<div class="flex h-full flex-col">
				<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
					<Sheet.Title>Edit details</Sheet.Title>
					<Sheet.Description class="text-sm text-muted-foreground">
						Update SKU and shipping settings for this inventory item.
					</Sheet.Description>
				</Sheet.Header>
				<div class="min-h-0 flex-1 overflow-auto p-6">
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-details-sku" class="text-sm font-medium">SKU</label>
							<Input
								id="edit-details-sku"
								name="sku"
								bind:value={$form.sku}
								placeholder="e.g. SKU-001"
								aria-invalid={$errors.sku ? 'true' : undefined}
								class={cn('h-9', $errors.sku && 'border-destructive')}
							/>
							{#if $errors.sku}
								<span class="text-xs text-destructive">{$errors.sku}</span>
							{/if}
							<p class="text-xs text-muted-foreground">
								Optional. Leave blank for non-shippable items.
							</p>
						</div>
						<div class="flex items-center gap-2">
							<input
								type="checkbox"
								id="edit-details-requires-shipping"
								name="requires_shipping"
								value="on"
								bind:checked={$form.requires_shipping}
								class="h-4 w-4 rounded border-input"
							/>
							<label for="edit-details-requires-shipping" class="text-sm font-medium"
								>Requires shipping</label
							>
						</div>
						{#if apiError}
							<div
								class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
							>
								{apiError}
							</div>
						{/if}
					</div>
				</div>
				<div class="flex justify-end gap-2 border-t p-4">
					<Button variant="outline" type="button" onclick={close} disabled={$delayed}>Cancel</Button>
					<Button type="submit" disabled={$delayed}>
						{$delayed ? 'Saving…' : 'Save'}
					</Button>
				</div>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
