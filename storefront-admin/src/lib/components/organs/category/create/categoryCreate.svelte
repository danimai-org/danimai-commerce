<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { toast, Toaster } from 'svelte-sonner';

	let {
		open = $bindable(false),
		onSuccess = () => {}
	}: {
		open?: boolean;
		onSuccess?: () => void;
	} = $props();

	const { form, errors, enhance, delayed } = superForm(
		{ name: '', handle: '' },
		{
			resetForm: true,
			onResult: ({ result }) => {
				if (result.status === 200) {
					toast.success('Category has been created successfully');
					open = false;
					onSuccess();
				}
			}
		}
	);

	function close() {
		if (!$delayed) open = false;
	}

	const sheetTitle = $derived('Create category');
	const subtitle = $derived('Add a new category.');
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md">
		<form method="POST" action="?/create" use:enhance class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{sheetTitle}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="category-name" class="text-sm font-medium">Name</label>
						<Input
							id="category-name"
							name="name"
							bind:value={$form.name}
							placeholder="e.g. Category Name"
							aria-invalid={$errors.name ? 'true' : undefined}
							class={cn($errors.name && 'border-destructive')}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="category-handle" class="text-sm font-medium">Handle</label>
						<Input
							id="category-handle"
							name="handle"
							bind:value={$form.handle}
							placeholder="e.g. category-name"
							aria-invalid={$errors.handle ? 'true' : undefined}
							class={cn($errors.handle && 'border-destructive')}
						/>
						{#if $errors.handle}
							<span class="text-xs text-destructive">{$errors.handle}</span>
						{/if}
						<p class="text-xs text-muted-foreground">
							Shown in URLs; use lowercase and hyphens. A leading "/" will be added when displayed.
						</p>
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Creating...' : 'Create'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
