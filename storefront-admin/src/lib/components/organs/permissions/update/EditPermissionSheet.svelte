<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';

	type Permission = {
		id: string;
		name: string;
		description: string;
		created_at: string | Date;
		updated_at: string | Date;
		deleted_at: string | Date | null;
	};

	let {
		open = $bindable(false),
		permission = null,
		onSaved
	}: {
		open: boolean;
		permission: Permission | null;
		onSaved?: () => void;
	} = $props();

	const { form, errors, enhance, delayed } = superForm(
		{ id: '', name: '', description: '' },
		{
			resetForm: false,
			onResult: ({ result }) => {
				if (result.status === 200) {
					open = false;
					onSaved?.();
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

		const nextId = permission?.id ?? '';
		if (initializedForId === nextId) return;
		initializedForId = nextId;

		$form = {
			id: nextId,
			name: permission?.name ?? '',
			description: permission?.description ?? ''
		};
	});

	function closeEdit() {
		open = false;
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Edit permission</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update name and description.
				</p>
			</div>
			<form action="?/update" method="POST" use:enhance class="flex flex-1 flex-col overflow-auto">
				<input type="hidden" name="id" bind:value={$form.id} />
				<div class="space-y-4 px-6 py-6">
					<div class="space-y-2">
						<label for="edit-permission-name" class="block text-sm font-medium">Name</label>
						<Input
							id="edit-permission-name"
							name="name"
							type="text"
							placeholder="e.g. customer:read"
							class={cn('w-full', $errors.name && 'border-destructive')}
							bind:value={$form.name}
							aria-invalid={$errors.name ? 'true' : undefined}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<div class="space-y-2">
						<label for="edit-permission-description" class="block text-sm font-medium">Description</label>
						<Input
							id="edit-permission-description"
							name="description"
							type="text"
							placeholder="Description"
							class={cn('w-full', $errors.description && 'border-destructive')}
							bind:value={$form.description}
							aria-invalid={$errors.description ? 'true' : undefined}
							disabled={$delayed}
						/>
						{#if $errors.description}
							<span class="text-xs text-destructive">{$errors.description}</span>
						{/if}
					</div>
				</div>
				<div class="flex justify-end gap-2 border-t p-4">
					<Button type="button" variant="outline" onclick={closeEdit} disabled={$delayed}>
						Cancel
					</Button>
					<Button type="submit" disabled={$delayed}>
						{$delayed ? 'Saving...' : 'Save'}
					</Button>
				</div>
			</form>
		</div>
	</Sheet.Content>
</Sheet.Root>
