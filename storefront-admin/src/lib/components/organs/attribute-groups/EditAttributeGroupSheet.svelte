<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { client } from '$lib/client';

	interface Props {
		group?: { id?: string; title?: string } | null;
		onSaved?: () => void | Promise<void>;
		onClosed?: () => void | Promise<void>;
	}

	let { group = null, onSaved = () => {}, onClosed = () => {} }: Props = $props();

	let open = $state(false);
	let title = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);
	let lastGroupId = $state<string | null>(null);

	$effect(() => {
		const groupId = group?.id ?? null;
		if (!groupId || lastGroupId === groupId) return;
		lastGroupId = groupId;
		title = group?.title ?? '';
		error = null;
		open = true;
	});

	$effect(() => {
		if (open) return;
		if (!lastGroupId) return;
		lastGroupId = null;
		if (!submitting) {
			onClosed();
		}
	});

	async function closeSheet() {
		if (submitting) return;
		open = false;
		error = null;
	}

	async function submitEdit() {
		if (!group?.id) return;
		error = null;
		if (!title.trim()) {
			error = 'Title is required';
			return;
		}
		submitting = true;
		try {
			await client['product-attribute-groups']({ id: group.id }).put({
				title: title.trim()
			} as any);
			open = false;
			await onSaved();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open={open}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Attribute Group</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the attribute group title.</p>
				{#if error && !submitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-title"
							bind:value={title}
							placeholder="e.g. Specifications"
							class={cn('h-9', error === 'Title is required' && 'border-destructive')}
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeSheet}>Cancel</Button>
				<Button onclick={submitEdit} disabled={submitting}>
					{submitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
