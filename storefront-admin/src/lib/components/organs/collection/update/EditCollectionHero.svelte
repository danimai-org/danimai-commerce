

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
		const CollectionUpdateSchema = z.object({
		id: z.string(),
		title: z.string().min(3, 'Title must be at least 3 characters').max(50, 'Title is too long'),
		handle: z.string().min(3, 'Handle must be at least 3 characters').max(50, 'Handle is too long'),
		
	});

	type CollectionFormData = z.infer<typeof CollectionUpdateSchema>;

	interface Props {
		collection?: CollectionFormData | null;
		onSaved?: () => void | Promise<void>;
		onClosed?: () => void | Promise<void>;
	}

	let { collection = null, onSaved = () => {}, onClosed = () => {} }: Props = $props();

	let open = $state(false);
	let lastCollectionId = $state<string | null>(null);

	const { form, errors, enhance, delayed, message, reset } = superForm(
		defaults({ id: '', title: '', handle: '' }, zod4(CollectionUpdateSchema)),
		{
			SPA: true,
			validators: zod4(CollectionUpdateSchema),
			async onUpdate({ form }) {
				if (!form.valid) return;
				try {
					const id = form.data.id;
					await client['collections']({ id }).put({
						title: form.data.title.trim(),
						handle: form.data.handle.trim(),
					});
					toast.success('Collection updated successfully');
					open = false;
					await onSaved();
				} catch (e: any) {
					const errorMessage = e?.message || 'Failed to update collection';
					message.set(errorMessage);
					toast.error(errorMessage);
				}
			}
		}
	);

	$effect(() => {
		const collectionId = collection?.id ?? null;
		if (!collectionId || lastCollectionId === collectionId) return;
		lastCollectionId = collectionId;
		const collectionValue = collection as any;
		const metadata =
			typeof collectionValue?.metadata === 'object' && collectionValue?.metadata !== null
				? collectionValue.metadata
				: {};
		reset({
			data: {
						id: collection?.id ?? '',
				title: collection?.title ?? collectionValue?.value ?? '',
				handle: (collection?.handle ?? metadata?.handle ?? '').replace(/^\//, ''),
				
			}
		});
		message.set('');
		open = true;
	});

	$effect(() => {
		if (open) return;
		if (!lastCollectionId) return;
		lastCollectionId = null;
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
					title: '',
					handle: '',
					
				}
			});
		}
	}
</script>

<Toaster richColors position="top-center" />


<Sheet.Root bind:open={open} onOpenChange={onOpenChange}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form method="POST" action="?/update" use:enhance class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Collection</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the collection title.</p>
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
					<div class="flex flex-col gap-2">
						<label for="edit-handle" class="text-sm font-medium">Handle</label>
						<Input
							id="edit-handle"
							name="handle"
							bind:value={$form.handle}
							placeholder="e.g. collection-name"
						
							class={cn('h-9', $errors.handle && 'border-destructive')}
						/>
						{#if $errors.handle}
							<span class="text-xs text-destructive">{$errors.handle}</span>
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
