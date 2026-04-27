<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import Upload from '@lucide/svelte/icons/upload-cloud';
	import Info from '@lucide/svelte/icons/info';
	import Image from '@lucide/svelte/icons/image';
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';

	let {
		createTitle = $bindable(''),
		createSubtitle = $bindable(''),
		createHandle = $bindable(''),
		createDescription = $bindable(''),
		createError = null as string | null,
		titleError = null as string | null,
		createHasVariants = $bindable(true),
		createMediaModalOpen = $bindable(false),
		createMediaImageUrl = $bindable(''),
		createMediaChosenFiles = $bindable([] as File[]),
		createMediaFileInput = $bindable(undefined as HTMLInputElement | undefined),
		createMediaUrls = $bindable([] as string[]),
		onEnableVariants = () => {}
	}: {
		createTitle: string;
		createSubtitle: string;
		createHandle: string;
		createDescription: string;
		createError: string | null;
		titleError: string | null;
		createHasVariants: boolean;
		createMediaModalOpen: boolean;
		createMediaImageUrl: string;
		createMediaChosenFiles: File[];
		createMediaFileInput: HTMLInputElement | undefined;
		createMediaUrls: string[];
		onEnableVariants?: () => void;
	} = $props();

	const mediaPreviewSrcs = $derived(createMediaUrls.filter((url) => url.trim().length > 0));
	const primaryMediaUrl = $derived(mediaPreviewSrcs[0] ?? '');
	const mediaFileRows = $derived(
		mediaPreviewSrcs.map((url, index) => ({
			url,
			file: createMediaChosenFiles[index],
			name: createMediaChosenFiles[index]?.name ?? `Image ${index + 1}`,
			sizeLabel: createMediaChosenFiles[index]
				? `${(createMediaChosenFiles[index].size / 1024).toFixed(1)} KB`
				: 'Uploaded image'
		}))
	);

	function readFileAsDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
			reader.readAsDataURL(file);
		});
	}

	async function handleSelectedFiles(files: File[]) {
		if (!files.length) return;
		try {
			const fileUrls = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
			createMediaUrls = [...createMediaUrls, ...fileUrls];
			createMediaChosenFiles = [...createMediaChosenFiles, ...files];
		} catch {
			// Ignore malformed files and keep existing images.
		}
		createMediaImageUrl = '';
		createMediaModalOpen = false;
	}

	function removeMediaAt(index: number) {
		createMediaUrls = createMediaUrls.filter((_, i) => i !== index);
		createMediaChosenFiles = createMediaChosenFiles.filter((_, i) => i !== index);
	}

	function setPrimaryMedia(index: number) {
		if (index <= 0 || index >= createMediaUrls.length) return;
		const nextUrls = [...createMediaUrls];
		const [primary] = nextUrls.splice(index, 1);
		nextUrls.unshift(primary);
		createMediaUrls = nextUrls;

		if (createMediaChosenFiles.length) {
			const nextFiles = [...createMediaChosenFiles];
			const [primaryFile] = nextFiles.splice(index, 1);
			if (primaryFile) {
				nextFiles.unshift(primaryFile);
				createMediaChosenFiles = nextFiles;
			}
		}
	}
</script>

<div class="flex-1 overflow-auto p-4 pt-4 sm:p-6 sm:pt-4">
	<h2 class="text-lg font-semibold">Details</h2>
	<p class="mt-1 text-sm text-muted-foreground">Add the basic information for your product.</p>
	<div class="mt-6 flex flex-col gap-6">
		<div class="flex flex-col gap-2">
			<label for="create-title" class="text-sm font-medium">Title</label>
			<Input
				id="create-title"
				bind:value={createTitle}
				placeholder="e.g. Winter jacket"
				class={cn(
					'h-9',
					(createError === 'Title is required' || titleError) && 'border-destructive'
				)}
			/>
			{#if titleError}
				<p class="text-xs text-destructive">{titleError}</p>
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<label for="create-subtitle" class="text-sm font-medium">
				Subtitle <span class="font-normal text-muted-foreground">(Optional)</span>
			</label>
			<Input
				id="create-subtitle"
				bind:value={createSubtitle}
				placeholder="e.g. Warm and cosy"
				class="h-9"
			/>
		</div>
		<div class="flex flex-col gap-2">
			<label for="create-handle" class="flex items-center gap-1.5 text-sm font-medium">
				Handle <span class="font-normal text-muted-foreground">(Optional)</span>
				<Info class="size-3.5 text-muted-foreground" />
			</label>
			<div class="relative">
				<span class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">/</span>
				<Input id="create-handle" bind:value={createHandle} placeholder="handle" class="h-9 pl-6" />
			</div>
		</div>
		<div class="flex flex-col gap-2">
			<label for="create-description" class="text-sm font-medium">
				Description <span class="font-normal text-muted-foreground">(Optional)</span>
			</label>
			<textarea
				id="create-description"
				bind:value={createDescription}
				placeholder="e.g. A warm and cozy jacket"
				rows="4"
				class="flex w-full min-w-0 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
			></textarea>
		</div>
		<div class="flex flex-col gap-2">
			<span class="text-sm font-medium">
				Media <span class="font-normal text-muted-foreground">(Optional)</span>
			</span>
			<div
				role="button"
				tabindex="0"
				aria-label="Media upload"
				class="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
				ondragover={(event) => event.preventDefault()}
				ondrop={async (event) => {
					event.preventDefault();
					const files = Array.from(event.dataTransfer?.files ?? []).filter((file) =>
						file.type.startsWith('image/')
					);
					await handleSelectedFiles(files);
				}}
				onclick={() => {
					createMediaImageUrl = '';
					createMediaFileInput?.click();
				}}
				onkeydown={(e) => {
					if (e.key !== 'Enter' && e.key !== ' ') return;
					e.preventDefault();
					createMediaImageUrl = '';
					createMediaFileInput?.click();
				}}
			>
				<Upload class="size-8 text-muted-foreground" />
				<p>Upload images</p>
				<p class="text-xs">Drag and drop images here or click to upload.</p>
			</div>
			<input
				type="file"
				accept="image/*"
				multiple
				class="hidden"
				bind:this={createMediaFileInput}
				onchange={async (e) => {
					const input = e.currentTarget as HTMLInputElement | null;
					const files = Array.from(input?.files ?? []);
					await handleSelectedFiles(files);
					if (input) input.value = '';
				}}
			/>
			{#if mediaPreviewSrcs.length > 0}
				<div class="flex flex-col gap-3 rounded-md border bg-muted/20 p-3">
					<div class="flex items-center justify-between">
						<p class="text-xs text-muted-foreground">{mediaPreviewSrcs.length} image(s) selected</p>
						<p class="text-xs text-muted-foreground">First image is used as thumbnail</p>
					</div>
					{#if primaryMediaUrl}
						<div class="overflow-hidden rounded-md border bg-background">
							<img
								src={primaryMediaUrl}
								alt="Primary media preview"
								class="aspect-video w-full object-cover"
								onerror={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')}
							/>
						</div>
					{/if}
					<div class="flex max-h-56 flex-col gap-2 overflow-auto">
						{#each mediaFileRows as mediaRow, index (mediaRow.url)}
							<div class="flex items-center gap-3 rounded-md border bg-background p-2">
								<img
									src={mediaRow.url}
									alt=""
									class="size-12 rounded-md border object-cover"
									onerror={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')}
								/>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium">{mediaRow.name}</p>
									<p class="text-xs text-muted-foreground">{mediaRow.sizeLabel}</p>
								</div>
								{#if index === 0}
									<span
										class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
									>
										<Image class="size-3" />
										Primary
									</span>
								{:else}
									<button
										type="button"
										class="rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted"
										onclick={() => setPrimaryMedia(index)}
									>
										Set primary
									</button>
								{/if}
								<button
									type="button"
									class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
									onclick={() => removeMediaAt(index)}
									aria-label={`Remove ${mediaRow.name}`}
								>
									<X class="size-4" />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<label for="create-has-variants" class="text-sm font-medium">Variants</label>
			<div class="flex items-center gap-2">
				<button
					id="create-has-variants"
					type="button"
					role="switch"
					aria-checked={createHasVariants}
					aria-label="Product has variants"
					class={cn(
						'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
						createHasVariants ? 'bg-primary' : 'bg-input'
					)}
					onclick={() => {
						createHasVariants = !createHasVariants;
						if (createHasVariants) onEnableVariants();
					}}
				>
					<span
						class={cn(
							'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
							createHasVariants ? 'translate-x-5' : 'translate-x-px'
						)}
					></span>
				</button>
				<span class="text-sm">Yes, this is a product with variants</span>
			</div>
			<p class="text-xs text-muted-foreground">
				When unchecked, we will create a default variant for you.
			</p>
		</div>
	</div>
</div>
