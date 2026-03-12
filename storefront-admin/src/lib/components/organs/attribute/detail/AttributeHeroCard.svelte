<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { client } from '$lib/client';

	interface Props {
		attribute: any | null;
		onUpdated?: () => void | Promise<void>;
	}

	let { attribute, onUpdated = () => {} }: Props = $props();

	let editOpen = $state(false);
	let editTitle = $state('');
	let editType = $state('string');
	let editError = $state<string | null>(null);
	let editSaving = $state(false);

	function openEditSheet() {
		if (!attribute) return;
		editTitle = attribute.title ?? '';
		editType = attribute.type ?? 'string';
		editError = null;
		editOpen = true;
	}

	function closeEditSheet() {
		if (editSaving) return;
		editOpen = false;
		editError = null;
	}

	async function saveEdit() {
		if (!attribute) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSaving = true;
		try {
			await client['product-attributes']({ id: attribute.id }).put({
				title: editTitle.trim(),
				type: editType
			} as any);
			editOpen = false;
			await onUpdated();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSaving = false;
		}
	}
</script>

<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6 pb-8">
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-2">
				<ListFilter class="size-5 text-muted-foreground" />
				<h1 class="text-2xl font-semibold tracking-tight">{attribute?.title ?? 'Attribute'}</h1>
			</div>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				onclick={openEditSheet}
				aria-label="Edit attribute"
				disabled={!attribute}
			>
				<Pencil class="size-4" />
			</Button>
		</div>
	</section>
	<div class="rounded-lg bg-card">
		<dl class="grid gap-3 text-sm sm:grid-cols-2">
			<div>
				<dt class="font-medium text-muted-foreground">Type</dt>
				<dd class="mt-1 font-medium">{attribute?.type ?? '—'}</dd>
			</div>
		</dl>
	</div>
</div>

<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
				<Sheet.Title>Edit attribute</Sheet.Title>
				<Sheet.Description class="text-sm text-muted-foreground">
					Update the attribute title and type.
				</Sheet.Description>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if editError}
					<div class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{editError}
					</div>
				{/if}
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-attribute-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-attribute-title"
							bind:value={editTitle}
							placeholder="e.g. Color"
							class="h-9"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-attribute-type" class="text-sm font-medium">Type</label>
						<select
							id="edit-attribute-type"
							bind:value={editType}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="string">String</option>
							<option value="number">Number</option>
							<option value="boolean">Boolean</option>
							<option value="date">Date</option>
						</select>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEditSheet} disabled={editSaving}>
					Cancel
				</Button>
				<Button onclick={saveEdit} disabled={editSaving || !editTitle.trim()}>
					{editSaving ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
