<script lang="ts">
	import { untrack } from 'svelte';
	import { SortableList, sortItems } from '@rodrigodagostino/svelte-sortable-list';
	import { client } from '$lib/client';
	import { getDetailContext } from '$lib/hooks';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import Upload from '@lucide/svelte/icons/upload-cloud';
	import type { Product } from '../type';

	interface Props {
		open: boolean;
		productId: string;
		thumbnail: string;
		onSaved: () => void | Promise<void>;
	}

	let { open = $bindable(false), productId, thumbnail, onSaved }: Props = $props();
	const detailQuery = getDetailContext<Product>();
	const product = $derived(detailQuery?.data ?? null);
	const productMedia = $derived.by(() => {
		const list = (product as { media?: Array<{ id: string; url: string; rank: number }> } | null)
			?.media;
		if (!Array.isArray(list)) return [];
		return [...list].sort((a, b) => a.rank - b.rank);
	});
	const apiBaseUrl = 'http://localhost:8000';

	let error = $state<string | null>(null);
	let submitting = $state(false);
	let prevOpen = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let primaryMediaId = $state<string | null>(null);
	let sortableMedia = $state<Array<{ id: string; url: string; rank: number }>>([]);

	$effect(() => {
		if (open && !prevOpen) {
			const currentMedia = untrack(() => productMedia);
			const currentThumbnail = untrack(() => thumbnail);
			sortableMedia = [...currentMedia];
			const matched = currentMedia.find((item) => item.url === currentThumbnail);
			primaryMediaId = matched?.id ?? currentMedia[0]?.id ?? null;
			error = null;
		}
		prevOpen = open;
	});

	$effect(() => {
		if (!open) return;
		const currentMedia = productMedia;
		sortableMedia = [...currentMedia];
		if (!currentMedia.some((item) => item.id === primaryMediaId)) {
			primaryMediaId = currentMedia[0]?.id ?? null;
		}
	});

	function handleDragEnd(event: SortableList.RootEvents['ondragend']) {
		const { draggedItemIndex, targetItemIndex, isCanceled } = event;
		if (
			isCanceled ||
			typeof targetItemIndex !== 'number' ||
			draggedItemIndex === targetItemIndex ||
			draggedItemIndex < 0
		) {
			return;
		}
		const reordered = sortItems(sortableMedia, draggedItemIndex, targetItemIndex).map(
			(item, index) => ({
				...item,
				rank: index
			})
		);
		sortableMedia = reordered;
		primaryMediaId = reordered[0]?.id ?? null;
	}
	function close() {
		open = false;
		error = null;
	}
	async function postImageMutation(body: FormData) {
		const response = await fetch(`${apiBaseUrl}/admin/products/${productId}/images`, {
			method: 'POST',
			body
		});
		if (!response.ok) {
			const payload = (await response.json().catch(() => null)) as { message?: string } | null;
			throw new Error(payload?.message ?? 'Failed to update product images');
		}
	}
	async function uploadSelectedFiles(files: File[]) {
		if (!files.length || !productId) return;
		error = null;
		submitting = true;
		try {
			const body = new FormData();
			for (const file of files) body.append('files', file);
			await postImageMutation(body);
			await onSaved();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}

	async function savePrimary() {
		if (!productId) {
			error = 'Missing product id.';
			return;
		}
		error = null;
		submitting = true;
		try {
			const res = await client.products({ id: productId }).put({
				thumbnail_media_id: primaryMediaId
			});
			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				throw new Error(err?.value?.message ?? String(res.error));
			}
			close();
			await onSaved();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}

	async function removeImage(mediaId: string) {
		if (!productId || !mediaId) return;
		error = null;
		submitting = true;
		try {
			const body = new FormData();
			body.append('delete_ids', JSON.stringify([mediaId]));
			await postImageMutation(body);
			if (primaryMediaId === mediaId) {
				const remaining = sortableMedia.filter((item) => item.id !== mediaId);
				primaryMediaId = remaining[0]?.id ?? null;
			}
			await onSaved();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full min-w-lg">
		<Sheet.Header class="w-full border-b px-6 py-4">
			<Sheet.Title>Edit media</Sheet.Title>
			<Sheet.Description class="text-sm text-muted-foreground">
				Upload product images, remove existing images, and choose the primary thumbnail.
			</Sheet.Description>
		</Sheet.Header>
		<div class="flex flex-col gap-4 p-6">
			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
			<div class="flex flex-col gap-2">
				<p class="text-sm font-medium">Upload images</p>
				<div
					role="button"
					tabindex="0"
					aria-label="Upload images"
					class="flex min-h-[110px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/40"
					ondragover={(event) => event.preventDefault()}
					ondrop={async (event) => {
						event.preventDefault();
						if (submitting) return;
						const files = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
							file.type.startsWith('image/')
						);
						await uploadSelectedFiles(files);
					}}
					onclick={() => fileInput?.click()}
					onkeydown={(event) => {
						if (event.key !== 'Enter' && event.key !== ' ') return;
						event.preventDefault();
						fileInput?.click();
					}}
				>
					<Upload class="size-7" />
					<p>Drop images here or click to upload</p>
				</div>
				<input
					type="file"
					accept="image/*"
					multiple
					class="hidden"
					bind:this={fileInput}
					onchange={async (event) => {
						const input = event.currentTarget as HTMLInputElement | null;
						const files = Array.from(input?.files ?? []);
						await uploadSelectedFiles(files);
						if (input) input.value = '';
					}}
				/>
			</div>
			{#if sortableMedia.length > 0}
				<div class="max-h-72 overflow-auto rounded-md border bg-muted/20 p-3">
					<SortableList.Root ondragend={handleDragEnd}>
						{#each sortableMedia as media, index (media.id)}
							<SortableList.Item id={media.id} {index}>
								<div
									class={cn(
										'mb-2 flex items-center gap-3 rounded-md border bg-muted/20 p-2',
										primaryMediaId === media.id && 'border-primary bg-primary/5'
									)}
								>
									<img
										src={media.url}
										alt=""
										class="size-14 rounded-md border object-cover"
										onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
									/>
									<div class="ml-auto flex items-center gap-2">
										{#if primaryMediaId === media.id}
											<span
												class="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
											>
												Primary
											</span>
										{/if}
										<Button
											type="button"
											variant="ghost"
											size="sm"
											class="text-destructive hover:bg-destructive/10"
											disabled={submitting}
											onclick={() => removeImage(media.id)}
										>
											Remove
										</Button>
									</div>
								</div>
							</SortableList.Item>
						{/each}
					</SortableList.Root>
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">No media uploaded yet.</p>
			{/if}
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2 border-t p-4">
			<Button
				variant="ghost"
				class="text-destructive hover:bg-destructive/10"
				onclick={() => (primaryMediaId = null)}
				disabled={submitting}
			>
				Clear primary
			</Button>
			<div class="flex gap-2">
				<Button variant="outline" onclick={close} disabled={submitting}>Cancel</Button>
				<Button onclick={savePrimary} disabled={submitting}>Save</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
