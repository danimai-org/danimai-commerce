<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
    import { toast, Toaster } from 'svelte-sonner';

	type Role = {
		id: string;
		name: string;
		description: string;
		created_at: string | Date;
		updated_at: string | Date;
		deleted_at: string | Date | null;
	};

	let {
		open = $bindable(false),
		mode = 'edit',
		role = null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: 'edit';
		role?: Role | null;
		onSuccess?: () => void;
	} = $props();

	const { form, errors, enhance, delayed } = superForm(
		{ id: '', name: '', description: '' },
		{
		resetForm: false,
		onResult: ({ result }) => {
			if (result.status === 200) {
				toast.success('Role has been updated successfully');
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

		const nextId = role?.id ?? '';
		if (initializedForId === nextId) return;
		initializedForId = nextId;

		$form = {
			id: nextId,
			name: role?.name ?? '',
			description: role?.description ?? ''
		};
	});

	function close() {
		open = false;
	}

	const title = $derived(mode === 'edit' ? 'Edit role' : 'Add role');
	const subtitle = $derived(
		mode === 'edit'
			? 'Update the role name and description.'
			: 'Create a new role with a name and optional description.'
	);
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />

			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>

				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="role-name" class="text-sm font-medium">Name</label>
						<Input
							id="role-name"
							name="name"
							bind:value={$form.name}
							placeholder="e.g. admin"
							aria-invalid={$errors.name ? 'true' : undefined}
							class={cn('h-9', $errors.name && 'border-destructive')}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<label for="role-desc" class="text-sm font-medium">Description</label>
						<Input
							id="role-desc"
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
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>{$delayed ? 'Saving...' : 'Save'}</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
<Toaster richColors position="top-center" />
