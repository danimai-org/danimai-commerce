<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { client } from '$lib/client.js';

	interface Props {
		collection: any | null;
		onUpdated?: () => void | Promise<void>;
	}

	let { collection, onUpdated = () => {} }: Props = $props();

	let editOpen = $state(false);
	let editTitle = $state('');
	let editHandle = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function getHandle(c: any | null): string {
		if (!c) return '';
		return c.handle.startsWith('/') ? c.handle : `/${c.handle}`;
	}

	function openEdit() {
		if (!collection) return;
		editOpen = true;
		editTitle = collection.title;
		editHandle = collection.handle.replace(/^\//, '') || '';
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editError = null;
	}

	async function submitEdit() {
		if (!collection) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const handle =
				editHandle.trim() ||
				editTitle
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^a-z0-9-]/g, '');

			const res = await client['collections']({ id: collection.id }).put({
				title: editTitle.trim(),
				handle
			});

			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				editError = err?.value?.message ?? String(res.error);
				return;
			}

			closeEdit();
			await onUpdated();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}
</script>

<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6 pb-8">
		<div class="flex items-center justify-between gap-4">
			<h1 class="text-2xl font-semibold tracking-tight">{collection?.title ?? 'Collection'}</h1>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				onclick={openEdit}
				aria-label="Edit collection"
				disabled={!collection}
			>
				<Pencil class="size-4" />
			</Button>
		</div>
		<div class="flex items-center gap-3">
			<label
				for="collection-handle"
				class="shrink-0 text-sm font-medium text-muted-foreground">Handle</label
			>
			<input
				id="collection-handle"
				type="text"
				value={getHandle(collection)}
				readonly
				class="h-9 max-w-xs rounded-md border border-input bg-background px-3 font-mono text-sm"
			/>
		</div>
	</section>

</div>

<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Collection</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update collection details.</p>

				{#if editError}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}

				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-title"
							bind:value={editTitle}
							placeholder="Enter collection title"
							class={editError && !editTitle.trim() ? 'h-9 border-destructive' : 'h-9'}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-handle" class="text-sm font-medium">Handle</label>
						<div class="relative">
							<span class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">/</span>
							<Input id="edit-handle" bind:value={editHandle} placeholder="handle" class="h-9 pl-6" />
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={submitEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

