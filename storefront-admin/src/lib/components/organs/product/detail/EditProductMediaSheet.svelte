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
	import ProductMediaImage from './ProductMediaImage.svelte';

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
	const thumbnailInMedia = $derived.by(() => {
		const thumb = thumbnail?.trim?.() ?? '';
		if (!thumb) return true;
		return productMedia.some((item) => item.url === thumb);
	});
	const apiBaseUrl = 'http://localhost:8000';

	let error = $state<string | null>(null);
	let submitting = $state(false);
	let prevOpen = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let primaryMediaId = $state<string | null>(null);
	let primaryDirty = $state(false);
	let rankDirty = $state(false);
	let removingMediaId = $state<string | null>(null);
	let sortableMedia = $state<Array<{ id: string; url: string; rank: number }>>([]);
	function normalizeMediaOrder(
		media: Array<{ id: string; url: string; rank: number }>,
		primaryId: string | null
	) {
		const ordered = [...media].sort((a, b) => a.rank - b.rank);
		if (primaryId) {
			const index = ordered.findIndex((item) => item.id === primaryId);
			if (index > 0) {
				const [primaryItem] = ordered.splice(index, 1);
				if (primaryItem) ordered.unshift(primaryItem);
			}
		}
		return ordered.map((item, index) => ({ ...item, rank: index }));
	}

	$effect(() => {
		if (open && !prevOpen) {
			const currentMedia = untrack(() => productMedia);
			const currentThumbnail = untrack(() => thumbnail);
			primaryDirty = false;
			rankDirty = false;

			const thumb = currentThumbnail?.trim?.() ?? '';
			if (thumb) {
				const matched = currentMedia.find((item) => item.url === thumb);
				primaryMediaId = matched?.id ?? null;
			} else {
				primaryMediaId = currentMedia[0]?.id ?? null;
			}
			sortableMedia = normalizeMediaOrder(currentMedia, primaryMediaId);
			error = null;
		}
		prevOpen = open;
	});

	$effect(() => {
		if (!open) return;
		const currentMedia = productMedia;
		const nextPrimary =
			primaryMediaId !== null && currentMedia.some((item) => item.id === primaryMediaId)
				? primaryMediaId
				: (currentMedia[0]?.id ?? null);
		primaryMediaId = nextPrimary;
		sortableMedia = normalizeMediaOrder(currentMedia, nextPrimary);
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
		const nextPrimary = reordered[0]?.id ?? null;
		primaryMediaId = nextPrimary;
		sortableMedia = normalizeMediaOrder(reordered, nextPrimary);
		primaryDirty = true;
		rankDirty = true;
	}
	function close() {
		open = false;
		error = null;
		primaryDirty = false;
		rankDirty = false;
		removingMediaId = null;
	}
	async function postImageMutation(payload: {
		files?: File[];
		delete_ids?: string[];
		type?: string;
	}) {
		const body = new FormData();
		for (const file of payload.files ?? []) body.append('files', file);
		if (payload.delete_ids && payload.delete_ids.length > 0) {
			body.append('delete_ids', JSON.stringify(payload.delete_ids));
		}
		if (payload.type) body.append('type', payload.type);

		const response = await fetch(`${apiBaseUrl}/admin/products/${productId}/images`, {
			method: 'POST',
			body
		});
		if (!response.ok) {
			const errorPayload = (await response.json().catch(() => null)) as
				| { message?: string; summary?: string }
				| null;
			throw new Error(
				errorPayload?.message ?? errorPayload?.summary ?? 'Failed to update product images'
			);
		}
	}
	async function uploadSelectedFiles(files: File[]) {
		if (!files.length || !productId) return;
		error = null;
		submitting = true;
		try {
			await postImageMutation({ files });
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
		if (!primaryDirty && !rankDirty) return;
		error = null;
		submitting = true;
		try {
			const normalizedMedia = normalizeMediaOrder(sortableMedia, primaryMediaId);
			const normalizedPrimaryMediaId = normalizedMedia[0]?.id ?? null;
			const res = await client.products({ id: productId }).put({
				thumbnail_media_id: normalizedPrimaryMediaId,
				media_ids: normalizedMedia.map((item) => item.id)
			});
			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				throw new Error(err?.value?.message ?? String(res.error));
			}
			primaryMediaId = normalizedPrimaryMediaId;
			sortableMedia = normalizedMedia;
			primaryDirty = false;
			rankDirty = false;
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
		const wasPrimary = primaryMediaId === mediaId;
		removingMediaId = mediaId;
		submitting = true;
		try {
			await postImageMutation({ delete_ids: [mediaId] });
			const remaining = sortableMedia.filter((item) => item.id !== mediaId);
			const nextPrimary = wasPrimary ? (remaining[0]?.id ?? null) : primaryMediaId;
			sortableMedia = normalizeMediaOrder(remaining, nextPrimary);
			rankDirty = true;
			if (wasPrimary) {
				primaryMediaId = nextPrimary;
				primaryDirty = true;
			}
			await onSaved();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			removingMediaId = null;
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full min-w-2xl">
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
					class={cn(
						'flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/40',
						submitting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
					)}
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
					{#if submitting}
						<div class="size-7 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"></div>
						<p>Uploading images...</p>
					{:else}
						<Upload class="size-7" />
						<p>Drop images here or click to upload</p>
					{/if}
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
			{#if thumbnail && !thumbnailInMedia && !primaryDirty && primaryMediaId === null}
				<div class="rounded-md border bg-muted/20 p-3">
					<div class="mb-2 flex items-center justify-between">
						<p class="text-sm font-medium">Primary thumbnail</p>
						<span
							class="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
							>Primary</span
						>
					</div>
					<ProductMediaImage
						src={thumbnail}
						alt=""
						class="size-20 rounded-md border object-cover"
					/>
				</div>
			{/if}
			{#if sortableMedia.length > 0}
				<div class="max-h-72 overflow-auto rounded-md border bg-muted/20 p-3">
					<SortableList.Root ondragend={handleDragEnd}>
						{#each sortableMedia as media, index (media.id)}
							<SortableList.Item id={media.id} {index}>
								<div
									class={cn(
										'mb-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border bg-muted/20 p-2',
										primaryMediaId === media.id && 'border-primary bg-primary/5'
									)}
								>
									<ProductMediaImage
										src={media.url}
										alt=""
										class="size-14 rounded-md border object-cover"
									/>
									<div class="flex items-center">
										{#if primaryMediaId === media.id}
											<span
												class="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
											>
												Primary
											</span>
										{/if}
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										class="justify-self-end whitespace-nowrap text-destructive hover:bg-destructive/10"
										disabled={submitting}
										onclick={() => removeImage(media.id)}
									>
										{#if removingMediaId === media.id}
											<span
												class="mr-1 inline-block size-3 animate-spin rounded-full border border-current border-t-transparent"
											></span>
											Removing...
										{:else}
											Remove
										{/if}
									</Button>
								</div>
							</SortableList.Item>
						{/each}
					</SortableList.Root>
				</div>
			{:else if thumbnail && !thumbnailInMedia && primaryMediaId === null}
				<p class="text-sm text-muted-foreground">No additional media uploaded yet.</p>
			{:else}
				<p class="text-sm text-muted-foreground">No media uploaded yet.</p>
			{/if}
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2 border-t p-4">
			<Button
				variant="ghost"
				class="text-destructive hover:bg-destructive/10"
				onclick={() => {
					primaryMediaId = null;
					primaryDirty = true;
				}}
				disabled={submitting}
			>
				Clear primary
			</Button>
			<div class="flex gap-2">
				<Button variant="outline" onclick={close} disabled={submitting}>Cancel</Button>
				<Button onclick={savePrimary} disabled={submitting || (!primaryDirty && !rankDirty)}
					>Save</Button
				>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
