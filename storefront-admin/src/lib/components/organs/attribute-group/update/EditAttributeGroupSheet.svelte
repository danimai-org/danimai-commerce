<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { Toaster, toast } from 'svelte-sonner';
	type AttributeGroupItem = { id: string; title: string; attribute_ids: string[]; required: boolean; rank: number };
	type Mode = 'update' ;

	interface Props {
		group?: AttributeGroupItem | null;
		mode?: Mode;
		onSaved?: () => void | Promise<void>;
		onClosed?: () => void | Promise<void>;
	}

	let { group = null, onSaved = () => {}, onClosed = () => {} }: Props = $props();

	let open = $state(false);
	let lastGroupId = $state<string | null>(null);

	const { form, errors, enhance, delayed, message, reset } = superForm(
		{ id: '', title: '', attribute_ids: [], required: false, rank: 0 },
		{
			resetForm: true,
			onResult: async ({ result }) => {
				if (result.status === 200) {
					toast.success('Attribute group updated successfully');
					await onSaved();
					open = false;
				}
			}
		}
	);

	$effect(() => {
		const groupId = group?.id ?? null;
		if (!groupId || lastGroupId === groupId) return;
		lastGroupId = groupId;
		reset({
			data: {
				id: group?.id ?? '',
				title: group?.title ?? '',
				// attribute_ids: (group?.attribute_ids ?? []) as string[],
				required: (group?.required ?? false) as boolean,
				rank: (group?.rank ?? 0) as number
			}
		});
		message.set('');
		open = true;
	});

	$effect(() => {
		if (open) return;
		if (!lastGroupId) return;
		lastGroupId = null;
		if (!$delayed) {
			onClosed();
		}
	});

	async function closeSheet() {
		if ($delayed) return;
		open = false;
		message.set('');
	}

	function onOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClosed();
			message.set('');
		}
	}
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open={open} onOpenChange={onOpenChange}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form method="POST" action="?/update" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<input type="hidden" name="required" value={$form.required ? 'true' : 'false'} />
			<input type="hidden" name="rank" value={String($form.rank)} />
			{#each $form.attribute_ids as attributeId}
				<input type="hidden" name="attribute_ids" value={attributeId} />
			{/each}
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Attribute Group</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the attribute group title.</p>
				{#if $message}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{$message}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-title"
							name="title"
							bind:value={$form.title}
							placeholder="e.g. Specifications"
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
