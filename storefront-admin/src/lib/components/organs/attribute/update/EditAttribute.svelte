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
	const AttributeUpdateSchema = z.object({
		id: z.string(),
		title: z.string().min(3, 'Title must be at least 3 characters').max(50, 'Title is too long'),
	});

	type AttributeFormData = z.infer<typeof AttributeUpdateSchema>;
	type AttributeItem = { id: string; title: string };
	type Mode = 'update' ;

	interface Props {
		attribute?: AttributeFormData | null;
		mode?: Mode;
		onSaved?: () => void | Promise<void>;
		onClosed?: () => void | Promise<void>;
	}

	let { attribute = null, onSaved = () => {}, onClosed = () => {} }: Props = $props();

	let open = $state(false);
	let lastAttributeId = $state<string | null>(null);

	const { form, errors, enhance, delayed, message, reset } = superForm(
		defaults({ id: '', title: '' }, zod4(AttributeUpdateSchema)),
		{
			SPA: true,
			validators: zod4(AttributeUpdateSchema),
			async onUpdate({ form }) {
				if (!form.valid) return;
				try {
					const id = form.data.id;
					await client['product-attributes']({ id }).put({
						id,
						title: form.data.title.trim(),
					});
					toast.success('Attribute updated successfully');
					open = false;
					await onSaved();
				} catch (e: any) {
					const errorMessage = e?.message || 'Failed to update attribute';
					message.set(errorMessage);
					toast.error(errorMessage);
				}
			}
		}
	);

	$effect(() => {
		const attributeId = attribute?.id ?? null;
		if (!attributeId || lastAttributeId === attributeId) return;
		lastAttributeId = attributeId;
		reset({
			data: {
				id: attribute?.id ?? '',
				title: attribute?.title ?? '',
			}
		});
		message.set('');
		open = true;
	});

	$effect(() => {
		if (open) return;
		if (!lastAttributeId) return;
		lastAttributeId = null;
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
					title: ''
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
				<h2 class="text-lg font-semibold">Edit Attribute</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the attribute title.</p>
				{#if $message}
					<p class="mt-4 text-sm text-destructive">{$message}</p>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>   
						<Input
							id="edit-title"
							name="title"
							bind:value={$form.title}
							    placeholder="e.g. Color"
							aria-invalid={$errors.title ? 'true' : undefined}
							class={cn('h-9', $errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
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
