<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { cn } from '$lib/utils.js';
	import { toast, Toaster } from 'svelte-sonner';

	let {
		open = $bindable(false),
		formData,
		onSuccess = () => {}
	}: {
		open?: boolean;
		formData: { value: string };
		onSuccess?: () => void | Promise<void>;
	} = $props();

	const initialFormData = $state.snapshot(formData);

	const { form, errors, enhance, delayed } = superForm(initialFormData, {
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'failure') {
				const data = result.data as { error?: string } | undefined;
				if (data?.error) toast.error(data.error);
				return;
			}
			if (result.status === 200) {
				toast.success('Tag created successfully');
				open = false;
				void onSuccess();
			}
		}
	});

	$effect(() => {
		if (open) {
			$form.value = '';
		}
	});

	const title = $derived('Create Tag');
	const submitLabel = $derived($delayed ? 'Creating...' : 'Create Tag');
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md">
		<form method="POST" action="?/create" use:enhance class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">Add a new product tag to your catalog.</p>

				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="value" class="text-sm font-medium">Tag Name</label>
						<Input
							id="value"
							name="value"
							bind:value={$form.value}
							placeholder="e.g. sale, new-arrival"
							aria-invalid={$errors.value ? 'true' : undefined}
							class={cn($errors.value && 'border-destructive')}
						/>
						{#if $errors.value}
							<span class="text-xs text-destructive">{$errors.value}</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{submitLabel}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
