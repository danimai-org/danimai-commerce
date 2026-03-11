<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { client } from '$lib/client.js';
	import type { ProductTag } from '$lib/product-tags/types.js';

	interface Props {
		tag: ProductTag | null;
		onUpdated?: () => void | Promise<void>;
	}

	let { tag, onUpdated = () => {} }: Props = $props();

	let editSheetOpen = $state(false);
	let editTagValue = $state('');
	let editTagError = $state<string | null>(null);
	let editTagSaving = $state(false);

	$effect(() => {
		if (editSheetOpen && tag) {
			editTagValue = tag.value;
			editTagError = null;
		}
	});

	function openEditTagSheet() {
		if (!tag) return;
		editSheetOpen = true;
	}

	async function saveTagEdit() {
		if (!tag) return;
		editTagError = null;
		if (!editTagValue.trim()) {
			editTagError = 'Value is required';
			return;
		}
		editTagSaving = true;
		try {
			const res = await client['product-tags']({ id: tag.id }).put({
				value: editTagValue.trim()
			});
			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				editTagError = err?.value?.message ?? String(res.error);
				return;
			}
			editSheetOpen = false;
			await onUpdated();
		} catch (e) {
			editTagError = e instanceof Error ? e.message : String(e);
		} finally {
			editTagSaving = false;
		}
	}
</script>

<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6 pb-8">
		<div class="flex items-center justify-between gap-4">
			<h1 class="text-2xl font-semibold tracking-tight">
				# {tag?.value ?? 'Tag'}
			</h1>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				onclick={openEditTagSheet}
				aria-label="Edit tag"
				disabled={!tag}
			>
				<Pencil class="size-4" />
			</Button>
		</div>
	</section>
</div>

<Sheet.Root bind:open={editSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
				<Sheet.Title>Edit tag</Sheet.Title>
				<Sheet.Description class="text-sm text-muted-foreground">
					Update the tag value.
				</Sheet.Description>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if editTagError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editTagError}
					</div>
				{/if}
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-2">
						<label for="edit-tag-value" class="text-sm font-medium">Tag value</label>
						<Input
							id="edit-tag-value"
							bind:value={editTagValue}
							placeholder="e.g. sale"
							class="h-9"
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button
					variant="outline"
					onclick={() => (editSheetOpen = false)}
					disabled={editTagSaving}
				>
					Cancel
				</Button>
				<Button onclick={saveTagEdit} disabled={editTagSaving || !editTagValue.trim()}>
					{editTagSaving ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

