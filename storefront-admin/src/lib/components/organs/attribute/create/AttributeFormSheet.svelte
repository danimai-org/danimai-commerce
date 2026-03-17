
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
		{ title: '', type: 'string' },
		{
			resetForm: true,
			onResult: ({ result }) => {
				if (result.status === 200) {
					toast.success('Attribute has been created successfully');
					open = false;
					onSuccess();
				}
			}
		}
	);

	function close() {
		if (!$delayed) open = false;
	}

	const sheetTitle = $derived('Create attribute');
	const subtitle = $derived('Add a new attribute.');
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
						<label for="attribute-title" class="text-sm font-medium">Title</label>
						<Input
							id="attribute-title"
							name="title"
							bind:value={$form.title}
							placeholder="e.g. Color, Size"
							aria-invalid={$errors.title ? 'true' : undefined}
							class={cn($errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="attribute-type" class="text-sm font-medium">Type</label>
						<Input
							id="attribute-type"
							name="type"
							bind:value={$form.type}
							placeholder="e.g. string, number, boolean, date"
							aria-invalid={$errors.type ? 'true' : undefined}
							class={cn($errors.type && 'border-destructive')}
						/>
						{#if $errors.type}
							<span class="text-xs text-destructive">{$errors.type}</span>
						{/if}
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
