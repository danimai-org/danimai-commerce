<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';

	let {
		open = $bindable(false),
		mode = 'edit',
		channel = null as any | null,
		salesChannelUpdateForm = { id: '', name: '', description: '', is_default: false },
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: 'edit';
		channel?: any | null;
		salesChannelUpdateForm?: any;
		onSuccess?: () => void;
	} = $props();

	const { form, errors, enhance, delayed } = superForm(salesChannelUpdateForm, {
		resetForm: false,
		onResult: ({ result }) => {
			if (result.status === 200) {
				open = false;
				onSuccess();
			}
		}
	});

	let initializedForId = $state<string | null>(null);

	$effect(() => {
		if (!open) {
			initializedForId = null;
			return;
		}

		const nextId = channel?.id ?? '';
		if (initializedForId === nextId) return;
		initializedForId = nextId;

		$form = {
			id: nextId,
			name: channel?.name ?? '',
			description: channel?.description ?? '',
			is_default: channel?.is_default ?? false
		};
	});

	function close() {
		open = false;
	}

	const title = $derived(mode === 'edit' ? 'Edit Sales Channel' : 'Create Sales Channel');
	const subtitle = $derived(
		mode === 'edit' ? 'Update the sales channel.' : 'Add a new sales channel.'
	);
	const submitLabel = $derived(
		$delayed ? (mode === 'edit' ? 'Saving...' : 'Creating...') : mode === 'edit' ? 'Save' : 'Create'
	);
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="sc-name" class="text-sm font-medium">Name</label>
						<Input
							id="sc-name"
							name="name"
							bind:value={$form.name}
							placeholder="e.g. Default Sales Channel"
							aria-invalid={$errors.name ? 'true' : undefined}
							class={cn('h-9', $errors.name && 'border-destructive')}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="sc-description" class="text-sm font-medium">Description</label>
						<Input
							id="sc-description"
							name="description"
							bind:value={$form.description}
							placeholder="Optional description"
							aria-invalid={$errors.description ? 'true' : undefined}
							class={cn('h-9', $errors.description && 'border-destructive')}
						/>
						{#if $errors.description}
							<span class="text-xs text-destructive">{$errors.description}</span>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="sc-is-default"
							name="is_default"
							bind:checked={$form.is_default}
							class="h-4 w-4 rounded border-input"
						/>
						<label for="sc-is-default" class="text-sm font-medium">Default</label>
					</div>
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
