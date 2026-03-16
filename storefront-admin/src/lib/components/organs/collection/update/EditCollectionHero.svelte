

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { Toaster, toast } from 'svelte-sonner';

	interface Props {
		collection?: {
			id: string;
			title?: string;
			value?: string;
			handle?: string;
			metadata?: { handle?: string } | null;
		} | null;
		onSaved?: () => void | Promise<void>;
		onClosed?: () => void | Promise<void>;
	}

	let { collection = null, onSaved = () => {}, onClosed = () => {} }: Props = $props();

	let open = $state(false);
	let lastCollectionId = $state<string | null>(null);

	const { form, errors, enhance, delayed, message, reset } = superForm(
		{ id: '', title: '', handle: '' },
		{
			resetForm: true,
			onResult: async ({ result }) => {
				if (result.status === 200) {
					toast.success('Collection updated successfully');
					await onSaved();
					open = false;
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
			<input type="hidden" name="id" bind:value={$form.id} />
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
