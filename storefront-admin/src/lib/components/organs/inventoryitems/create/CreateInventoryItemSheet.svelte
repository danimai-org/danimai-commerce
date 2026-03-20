<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { toast, Toaster } from 'svelte-sonner';

	
	let {
		open = $bindable(false),
		onSuccess = () => {}
	}: {
		open?: boolean;
		onSuccess?: () => void | Promise<void>;
	} = $props();

	let apiError = $state<string | null>(null);

	const { form, errors, enhance, delayed, reset } = superForm({ sku: '', requires_shipping: true }, {
		resetForm: true,
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
				await onSuccess();
			}
		}
	});

	let initialized = $state(false);

	$effect(() => {
		if (!open) {
			initialized = false;
			return;
		}
		if (initialized) return;
		initialized = true;
		apiError = null;
		reset({ data: { sku: '', requires_shipping: true } });
	});

	function close() {
		if (!$delayed) open = false;
	}
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/create" method="POST" use:enhance class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create inventory item</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new inventory item by SKU and shipping options.
				</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="create-sku" class="text-sm font-medium">SKU</label>
						<Input
							id="create-sku"
							name="sku"
							type="text"
							placeholder="Optional"
							bind:value={$form.sku}
							aria-invalid={$errors.sku ? 'true' : undefined}
							class={cn('w-full', $errors.sku && 'border-destructive')}
						/>
						{#if $errors.sku}
							<span class="text-xs text-destructive">{$errors.sku}</span>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="create-requires-shipping"
							name="requires_shipping"
							value="on"
							bind:checked={$form.requires_shipping}
							class="size-4 rounded border-input"
						/>
						<label for="create-requires-shipping" class="text-sm font-medium">Requires shipping</label>
					</div>
					{#if apiError}
						<div
							class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
						>
							{apiError}
						</div>
					{/if}
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={close} disabled={$delayed}>
					Cancel
				</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
