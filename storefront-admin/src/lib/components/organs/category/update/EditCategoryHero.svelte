
<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { Toaster, toast } from 'svelte-sonner';
	
	type Mode = 'update' ;

	interface Props {
		category?: {
			id: string;
			title?: string;
			value?: string;
			handle?: string;
			description?: string;
			visibility?: 'public' | 'private';
			status?: 'active' | 'inactive';
			metadata?: { handle?: string; description?: string } | null;
		} | null;
		mode?: Mode;
		onSaved?: () => void | Promise<void>;
		onClosed?: () => void | Promise<void>;
	}

	let { category = null, onSaved = () => {}, onClosed = () => {} }: Props = $props();

	let open = $state(false);
	let lastCategoryId = $state<string | null>(null);

	const { form, errors, enhance, delayed, message, reset } = superForm(
		{ id: '', title: '', handle: '', description: '', visibility: 'public', status: 'active' },
		{
			resetForm: true,
			onResult: async ({ result }) => {
				if (result.status === 200) {
					toast.success('Category updated successfully');
					await onSaved();
					open = false;
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
			<input type="hidden" name="id" bind:value={$form.id} />
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
