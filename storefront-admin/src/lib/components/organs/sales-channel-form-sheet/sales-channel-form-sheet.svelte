<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { createSalesChannel, updateSalesChannel } from '$lib/sales-channels/api.js';
	import type { SalesChannel } from '$lib/sales-channels/types.js';
	import { cn } from '$lib/utils.js';

	let {
		open = $bindable(false),
		mode = 'create',
		channel = null as SalesChannel | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: 'create' | 'edit';
		channel?: SalesChannel | null;
		onSuccess?: () => void;
	} = $props();

	let name = $state('');
	let description = $state('');
	let isDefault = $state(false);
	let error = $state<string | null>(null);
	let submitting = $state(false);

	$effect(() => {
		if (open) {
			error = null;
			if (mode === 'edit' && channel) {
				name = channel.name;
				description = channel.description ?? '';
				isDefault = channel.is_default;
			} else {
				name = '';
				description = '';
				isDefault = false;
			}
		}
	});

	function close() {
		if (!submitting) open = false;
	}

	async function submit() {
		error = null;
		if (!name.trim()) {
			error = 'Name is required';
			return;
		}
		submitting = true;
		try {
			const payload = {
				name: name.trim(),
				description: description.trim() || null,
				is_default: isDefault
			};
			if (mode === 'edit' && channel) {
				await updateSalesChannel(channel.id, payload);
			} else {
				await createSalesChannel(payload);
			}
			open = false;
			onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}

	const title = $derived(mode === 'edit' ? 'Edit Sales Channel' : 'Create Sales Channel');
	const subtitle = $derived(
		mode === 'edit' ? 'Update the sales channel.' : 'Add a new sales channel.'
	);
	const submitLabel = $derived(submitting ? (mode === 'edit' ? 'Saving…' : 'Creating…') : mode === 'edit' ? 'Save' : 'Create');
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{subtitle}
				</p>
				{#if error && !submitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="sc-name" class="text-sm font-medium">Name</label>
						<Input
							id="sc-name"
							bind:value={name}
							placeholder="e.g. Default Sales Channel"
							class={cn('h-9', error === 'Name is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="sc-description" class="text-sm font-medium">Description</label>
						<Input
							id="sc-description"
							bind:value={description}
							placeholder="Optional description"
							class="h-9"
						/>
					</div>
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="sc-is-default"
							bind:checked={isDefault}
							class="h-4 w-4 rounded border-input"
						/>
						<label for="sc-is-default" class="text-sm font-medium">Default</label>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close}>Cancel</Button>
				<Button onclick={submit} disabled={submitting}>
					{submitLabel}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
