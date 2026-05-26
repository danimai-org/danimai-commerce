<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import Upload from '@lucide/svelte/icons/upload-cloud';
	import Image from '@lucide/svelte/icons/image';
	import X from '@lucide/svelte/icons/x';
	import { SortableList, sortItems } from '@rodrigodagostino/svelte-sortable-list';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import {
		fileFingerprint,
		previewUrl,
		type MediaUploadItem
	} from './media-upload.types.js';

	import ImageGalleryModal, {
		type GalleryImage
	} from '$lib/components/shared/image-gallery-modal.svelte';

	type Props = {
		value?: MediaUploadItem[];
		onChange?: (next: MediaUploadItem[]) => void;
		maxFiles?: number;
		editable?: boolean;
		disabled?: boolean;
		uploading?: boolean;
		onPickFiles?: (files: File[]) => void | Promise<void>;
		onRemoveRemote?: (id: string) => void | Promise<void>;
		pendingRemoveId?: string | null;
		showHeroPreview?: boolean;
		enableGallery?: boolean;
	};

	let {
		value = $bindable([] as MediaUploadItem[]),
		onChange,
		maxFiles,
		editable = true,
		disabled = false,
		uploading = false,
		onPickFiles,
		onRemoveRemote,
		pendingRemoveId = null,
		showHeroPreview = true,
		enableGallery = true
	}: Props = $props();

	let fileInput = $state<HTMLInputElement | null>(null);
	let galleryOpen = $state(false);
	let galleryInitialIndex = $state(0);

	const galleryImages = $derived<GalleryImage[]>(
		value.map((item) => ({ id: item.id, src: previewUrl(item).trim() }))
	);

	function openGallery(index: number) {
		if (!enableGallery || !galleryImages.some((g) => g.src.length > 0)) return;
		galleryInitialIndex = Math.min(Math.max(0, index), galleryImages.length - 1);
		galleryOpen = true;
	}

	function emit(next: MediaUploadItem[]) {
		value = next;
		onChange?.(next);
	}

	function collectLocalFingerprints(items: MediaUploadItem[]): SvelteSet<string> {
		const s = new SvelteSet<string>();
		for (const it of items) {
			if (it.kind === 'local') s.add(fileFingerprint(it.file));
		}
		return s;
	}

	function dedupeIncomingFiles(files: File[], existing: MediaUploadItem[]): File[] {
		const fps = collectLocalFingerprints(existing);
		const seen = new SvelteSet<string>();
		const out: File[] = [];
		for (const f of files) {
			const fp = fileFingerprint(f);
			if (fps.has(fp) || seen.has(fp)) continue;
			seen.add(fp);
			fps.add(fp);
			out.push(f);
		}
		return out;
	}

	function remainingSlots(): number | undefined {
		if (maxFiles === undefined) return undefined;
		return Math.max(0, maxFiles - value.length);
	}

	function filterImageFiles(files: File[]): File[] {
		return files.filter((f) => f.type.startsWith('image/'));
	}

	async function readFileAsDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
			reader.readAsDataURL(file);
		});
	}

	async function ingestFiles(files: File[]) {
		let imageFiles = filterImageFiles(files);
		if (!imageFiles.length || disabled) return;

		const slots = remainingSlots();
		if (slots !== undefined && slots <= 0) return;

		imageFiles = dedupeIncomingFiles(imageFiles, value);
		if (slots !== undefined) imageFiles = imageFiles.slice(0, slots);
		if (!imageFiles.length) return;

		if (onPickFiles) {
			await onPickFiles(imageFiles);
			return;
		}

		try {
			const previews = await Promise.all(imageFiles.map((file) => readFileAsDataUrl(file)));
			const additions: MediaUploadItem[] = imageFiles.map((file, i) => ({
				kind: 'local',
				id: crypto.randomUUID(),
				file,
				preview: previews[i] ?? ''
			}));
			emit([...value, ...additions]);
		} catch {
			// Ignore malformed files and keep existing images.
		}
	}

	function removeAt(index: number) {
		const item = value[index];
		if (!item || disabled) return;
		if (item.kind === 'remote' && onRemoveRemote) {
			void onRemoveRemote(item.id);
			return;
		}
		emit(value.filter((_, i) => i !== index));
	}

	function handleDragEnd(event: SortableList.RootEvents['ondragend']) {
		if (!editable || disabled) return;
		const { draggedItemIndex, targetItemIndex, isCanceled } = event;
		if (
			isCanceled ||
			typeof targetItemIndex !== 'number' ||
			draggedItemIndex === targetItemIndex ||
			draggedItemIndex < 0
		) {
			return;
		}
		emit(sortItems(value, draggedItemIndex, targetItemIndex));
	}

	function mediaSizeLabel(file: File): string {
		return `${(file.size / 1024).toFixed(1)} KB`;
	}

	const primaryPreviewUrl = $derived(previewUrl(value[0])?.trim() ?? '');
</script>

{#snippet sortableList()}
	<SortableList.Root ondragend={handleDragEnd}>
		{#each value as mediaRow, index (mediaRow.id)}
			<SortableList.Item id={mediaRow.id} {index}>
				{#if mediaRow.kind === 'local'}
					<div class="mb-2 flex items-center gap-3 rounded-md border bg-background p-2">
						{#if enableGallery}
							<button
								type="button"
								class="shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
								onclick={(e) => {
									e.stopPropagation();
									openGallery(index);
								}}
								aria-label="Open image in gallery"
							>
								<img
									src={mediaRow.preview}
									alt=""
									class="size-12 rounded-md border object-cover"
									onerror={(ev) =>
										((ev.currentTarget as HTMLImageElement).style.display = 'none')}
								/>
							</button>
						{:else}
							<img
								src={mediaRow.preview}
								alt=""
								class="size-12 rounded-md border object-cover"
								onerror={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')}
							/>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{mediaRow.file.name}</p>
							<p class="text-xs text-muted-foreground">{mediaSizeLabel(mediaRow.file)}</p>
						</div>
						{#if index === 0}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
							>
								<Image class="size-3" />
								Primary
							</span>
						{/if}
						<button
							type="button"
							class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
							disabled={disabled || !editable}
							onclick={() => removeAt(index)}
							aria-label={`Remove ${mediaRow.file.name}`}
						>
							<X class="size-4" />
						</button>
					</div>
				{:else}
					<div
						class={cn(
							'mb-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border bg-muted/20 p-2',
							index === 0 && 'border-primary bg-primary/5'
						)}
					>
						{#if enableGallery}
							<button
								type="button"
								class="shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
								onclick={(e) => {
									e.stopPropagation();
									openGallery(index);
								}}
								aria-label="Open image in gallery"
							>
								<img
									src={mediaRow.url}
									alt=""
									class="size-14 rounded-md border object-cover"
									onerror={(ev) =>
										((ev.currentTarget as HTMLImageElement).style.display = 'none')}
								/>
							</button>
						{:else}
							<img
								src={mediaRow.url}
								alt=""
								class="size-14 rounded-md border object-cover"
								onerror={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')}
							/>
						{/if}
						<div class="flex items-center">
							{#if index === 0}
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
							disabled={disabled || !editable}
							onclick={() => removeAt(index)}
						>
							{#if pendingRemoveId === mediaRow.id}
								<span
									class="mr-1 inline-block size-3 animate-spin rounded-full border border-current border-t-transparent"
								></span>
								Removing...
							{:else}
								Remove
							{/if}
						</Button>
					</div>
				{/if}
			</SortableList.Item>
		{/each}
	</SortableList.Root>
{/snippet}

{#if editable}
	<div
		role="button"
		tabindex="0"
		aria-label="Media upload"
		class={cn(
			'flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/50',
			disabled && 'cursor-not-allowed opacity-70'
		)}
		ondragover={(event) => event.preventDefault()}
		ondrop={async (event) => {
			event.preventDefault();
			if (disabled) return;
			const files = Array.from(event.dataTransfer?.files ?? []);
			await ingestFiles(files);
		}}
		onclick={() => {
			if (!disabled) fileInput?.click();
		}}
		onkeydown={(e) => {
			if (e.key !== 'Enter' && e.key !== ' ') return;
			e.preventDefault();
			if (!disabled) fileInput?.click();
		}}
	>
		{#if uploading}
			<div
				class="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
			></div>
			<p>Uploading images...</p>
		{:else}
			<Upload class="size-8 text-muted-foreground" />
			<p>Upload images</p>
			<p class="text-xs">Drag and drop images here or click to upload.</p>
		{/if}
	</div>
	<input
		type="file"
		accept="image/*"
		multiple
		class="hidden"
		bind:this={fileInput}
		onchange={async (e) => {
			const input = e.currentTarget as HTMLInputElement | null;
			const files = Array.from(input?.files ?? []);
			await ingestFiles(files);
			if (input) input.value = '';
		}}
	/>
{/if}

{#if value.length > 0}
	{#if showHeroPreview}
		<div class="flex flex-col gap-3 rounded-md border bg-muted/20 p-3">
			<div class="flex items-center justify-between">
				<p class="text-xs text-muted-foreground">{value.length} image(s) selected</p>
				<p class="text-xs text-muted-foreground">First image is used as thumbnail</p>
			</div>
			{#if primaryPreviewUrl}
				{#if enableGallery}
					<button
						type="button"
						class="relative block w-full overflow-hidden rounded-md border bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						onclick={() => openGallery(0)}
						aria-label="Open primary image in gallery"
					>
						<img
							src={primaryPreviewUrl}
							alt="Primary media preview"
							class="aspect-video w-full object-cover"
							onerror={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')}
						/>
					</button>
				{:else}
					<div class="overflow-hidden rounded-md border bg-background">
						<img
							src={primaryPreviewUrl}
							alt="Primary media preview"
							class="aspect-video w-full object-cover"
							onerror={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')}
						/>
					</div>
				{/if}
			{/if}
			<div class="flex max-h-56 flex-col gap-2 overflow-auto">
				{@render sortableList()}
			</div>
		</div>
	{:else}
		<div class="max-h-72 overflow-auto rounded-md border bg-muted/20 p-3">
			{@render sortableList()}
		</div>
	{/if}
{/if}

<ImageGalleryModal bind:open={galleryOpen} images={galleryImages} initialIndex={galleryInitialIndex} />
