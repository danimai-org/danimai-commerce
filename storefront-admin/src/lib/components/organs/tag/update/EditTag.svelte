<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { client } from '$lib/client';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';
	import { Toaster, toast } from 'svelte-sonner';
	const TagUpdateSchema = z.object({
		id: z.string(),
		value: z.string().min(3, 'Value must be at least 3 characters').max(50, 'Value is too long'),
	});

	type TagFormData = z.infer<typeof TagUpdateSchema>;
	type TagItem = { id: string; value: string };
	type Mode = 'update' ;

	interface Props {
		tag?: TagItem | null;
		mode?: Mode;
		onSaved?: () => void | Promise<void>;
		onClosed?: () => void | Promise<void>;
	}

	let { tag = null, onSaved = () => {}, onClosed = () => {} }: Props = $props();

	let open = $state(false);
	let lastTagId = $state<string | null>(null);

	const { form, errors, enhance, delayed, message, reset } = superForm(
		defaults({ id: '', value: '' }, zod4(TagUpdateSchema)),
		{
			SPA: true,
			validators: zod4(TagUpdateSchema),
			async onUpdate({ form }) {
				if (!form.valid) return;
				try {
					await client['product-tags']({ id: form.data.id }).put({
						value: form.data.value.trim(),
					});
					toast.success('Tag updated successfully');
					open = false;
					await onSaved();
				} catch (e: any) {
					const errorMessage = e?.message || 'An unexpected error occurred';
					message.set(errorMessage);
					toast.error(errorMessage);
				}
			}
		}
	);

	$effect(() => {
		const tagId = tag?.id ?? null;
		if (!tagId || lastTagId === tagId) return;
		lastTagId = tagId;
		reset({
			data: {
				id: tag?.id ?? '',
				value: tag?.value ?? '',
			}
		});
		message.set('');
		open = true;
	});

	$effect(() => {
		if (open) return;
		if (!lastTagId) return;
		lastTagId = null;
		if (!$delayed) {
			onClosed();
		}
	});

	async function closeSheet() {
		if ($delayed) return;
		open = false;
		message.set('');
	}

	function onOpenChange(open: boolean) {
		if (!open) {
			onClosed();
			message.set('');
			reset({
				data: {
					id: '',
					value: ''
				}
			});
		}
	}
</script>

<Toaster richColors position="top-center" />


<Sheet.Root bind:open={open} onOpenChange={onOpenChange}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Tag</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the tag value.</p>
				{#if $message}
					<p class="mt-4 text-sm text-destructive">{$message}</p>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-value" class="text-sm font-medium">Value</label>   
						<Input
							id="edit-value"
							name="value"
							bind:value={$form.value}
							    placeholder="e.g. sale, new-arrival"
							aria-invalid={$errors.value ? 'true' : undefined}
							class={cn('h-9', $errors.value && 'border-destructive')}
						/>
						{#if $errors.value}
							<span class="text-xs text-destructive">{$errors.value}</span>
						{/if}
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" onclick={closeSheet}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
