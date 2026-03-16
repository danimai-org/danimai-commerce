
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
	const CategoryUpdateSchema = z.object({
		id: z.string(),
		title: z.string().min(3, 'Title must be at least 3 characters').max(50, 'Title is too long'),
		handle: z.string().min(3, 'Handle must be at least 3 characters').max(50, 'Handle is too long'),
		description: z.string().min(3, 'Description must be at least 3 characters').max(200, 'Description is too long'),
		visibility: z.enum(['public', 'private']),
		status: z.enum(['active', 'inactive']),
	});

	type CategoryFormData = z.infer<typeof CategoryUpdateSchema>;
	type Mode = 'update' ;

	interface Props {
		category?: CategoryFormData | null;
		mode?: Mode;
		onSaved?: () => void | Promise<void>;
		onClosed?: () => void | Promise<void>;
	}

	let { category = null, onSaved = () => {}, onClosed = () => {} }: Props = $props();

	let open = $state(false);
	let lastCategoryId = $state<string | null>(null);

	const { form, errors, enhance, delayed, message, reset } = superForm(
		defaults({ id: '', title: '', handle: '', description: '', visibility: 'public', status: 'active' }, zod4(CategoryUpdateSchema)),
		{
			SPA: true,
			validators: zod4(CategoryUpdateSchema),
			async onUpdate({ form }) {
				if (!form.valid) return;
				try {
					const id = form.data.id;
					await client['product-categories']({ id }).put({
						value: form.data.title.trim(),
						metadata: {
							description: form.data.description.trim(),
							handle: form.data.handle.trim()
						},
						visibility: form.data.visibility as any,
						status: form.data.status as any,
					});
					toast.success('Category updated successfully');
					open = false;
					await onSaved();
				} catch (e: any) {
					const errorMessage = e?.message || 'Failed to update category';
					message.set(errorMessage);
					toast.error(errorMessage);
				}
			}
		}
	);

	$effect(() => {
		const categoryId = category?.id ?? null;
		if (!categoryId || lastCategoryId === categoryId) return;
		lastCategoryId = categoryId;
		const categoryValue = category as any;
		const metadata =
			typeof categoryValue?.metadata === 'object' && categoryValue?.metadata !== null
				? categoryValue.metadata
				: {};
		reset({
			data: {
				id: category?.id ?? '',
				title: category?.title ?? categoryValue?.value ?? '',
				handle: (category?.handle ?? metadata?.handle ?? '').replace(/^\//, ''),
				description: category?.description ?? metadata?.description ?? '',
				visibility: category?.visibility ?? 'public',
				status: category?.status ?? 'active',
			}
		});
		message.set('');
		open = true;
	});

	$effect(() => {
		if (open) return;
		if (!lastCategoryId) return;
		lastCategoryId = null;
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
					description: '',
					visibility: 'public',
					status: 'active',
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
				<h2 class="text-lg font-semibold">Edit Category</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the category title.</p>
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
							placeholder="e.g. category-name"
						
							class={cn('h-9', $errors.handle && 'border-destructive')}
						/>
						{#if $errors.handle}
							<span class="text-xs text-destructive">{$errors.handle}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-description" class="text-sm font-medium">Description</label>
						<textarea
							id="edit-description"
							name="description"
							bind:value={$form.description}
							placeholder="e.g. This is a category description"
							class={cn(
								'flex min-h-[96px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
								$errors.description && 'border-destructive'
							)}
							rows="4"
						></textarea>
						{#if $errors.description}
							<span class="text-xs text-destructive">{$errors.description}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-visibility" class="text-sm font-medium">Visibility</label>
						<select
							id="edit-visibility"
							name="visibility"
							bind:value={$form.visibility}
							class={cn(
								'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
								$errors.visibility && 'border-destructive'
							)}
						>
							<option value="public">Public</option>
							<option value="private">Private</option>
						</select>
						{#if $errors.visibility}
							<span class="text-xs text-destructive">{$errors.visibility}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-status" class="text-sm font-medium">Status</label>
						<select
							id="edit-status"
							name="status"
							bind:value={$form.status}
							class={cn(
								'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
								$errors.status && 'border-destructive'
							)}
						>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
						{#if $errors.status}
							<span class="text-xs text-destructive">{$errors.status}</span>
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
