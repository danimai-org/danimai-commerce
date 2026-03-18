<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Upload from '@lucide/svelte/icons/upload-cloud';
	import Info from '@lucide/svelte/icons/info';
	import { cn } from '$lib/utils.js';

	let {
		createTitle = $bindable(''),
		createSubtitle = $bindable(''),
		createHandle = $bindable(''),
		createDescription = $bindable(''),
		createError = null as string | null,
		createHasVariants = $bindable(true),
		createMediaModalOpen = $bindable(false),
		createMediaImageUrl = $bindable(''),
		createMediaChosenFile = $bindable(null as File | null),
		createMediaFileInput = $bindable(undefined as HTMLInputElement | undefined),
		createMediaUrl = $bindable(''),
		createMediaFile = $bindable(null as File | null),
		onEnableVariants = () => {}
	}: {
		createTitle: string;
		createSubtitle: string;
		createHandle: string;
		createDescription: string;
		createError: string | null;
		createHasVariants: boolean;
		createMediaModalOpen: boolean;
		createMediaImageUrl: string;
		createMediaChosenFile: File | null;
		createMediaFileInput: HTMLInputElement | undefined;
		createMediaUrl: string;
		createMediaFile: File | null;
		onEnableVariants?: () => void;
	} = $props();
</script>

<div class="flex-1 overflow-auto p-6 pt-4">
	<h2 class="text-lg font-semibold">Details</h2>
	<p class="mt-1 text-sm text-muted-foreground">Add the basic information for your product.</p>
	<div class="mt-6 flex flex-col gap-6">
		<div class="flex flex-col gap-2">
			<label for="create-title" class="text-sm font-medium">Title</label>
			<Input
				id="create-title"
				bind:value={createTitle}
				placeholder="e.g. Winter jacket"
				class={cn('h-9', createError === 'Title is required' && 'border-destructive')}
			/>
		</div>
		<div class="flex flex-col gap-2">
			<label for="create-subtitle" class="text-sm font-medium">
				Subtitle <span class="font-normal text-muted-foreground">(Optional)</span>
			</label>
			<Input id="create-subtitle" bind:value={createSubtitle} placeholder="e.g. Warm and cosy" class="h-9" />
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
				class="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
				onclick={() => {
					createMediaImageUrl = createMediaUrl;
					createMediaChosenFile = createMediaFile;
					createMediaModalOpen = true;
				}}
				onkeydown={(e) => e.key === 'Enter' && (createMediaModalOpen = true)}
			>
				<Upload class="size-8 text-muted-foreground" />
				<p>Drag and drop images here or click to upload.</p>
				{#if createMediaUrl || createMediaFile}
					<p class="text-xs text-muted-foreground">
						{createMediaUrl ? 'Image URL set' : (createMediaFile?.name ?? '1 image selected')}
					</p>
				{/if}
			</div>
			<Dialog.Root bind:open={createMediaModalOpen}>
				<Dialog.Content
					class="mx-auto my-auto h-max max-h-[90dvh] w-full max-w-md overflow-auto rounded-lg border shadow-lg"
				>
					<Dialog.Header>
						<Dialog.Title>Provide an image</Dialog.Title>
					</Dialog.Header>
					<div class="grid gap-4 p-[10px]">
						<div class="flex flex-col gap-2">
							<label for="create-media-url" class="text-sm font-medium">Image URL</label>
							<Input
								id="create-media-url"
								type="url"
								placeholder="https://..."
								bind:value={createMediaImageUrl}
								class="w-full"
							/>
						</div>
						<p class="text-sm text-muted-foreground">Or choose file</p>
						<div class="flex items-center gap-2">
							<input
								type="file"
								accept="image/*"
								class="hidden"
								bind:this={createMediaFileInput}
								onchange={(e) => {
									const f = e.currentTarget.files?.[0];
									if (f) createMediaChosenFile = f;
									e.currentTarget.value = '';
								}}
							/>
							<Button type="button" variant="outline" onclick={() => createMediaFileInput?.click()}>
								Choose file
							</Button>
							<span class="text-sm text-muted-foreground">
								{createMediaChosenFile?.name ?? 'No file chosen'}
							</span>
						</div>
					</div>
					<Dialog.Footer class="flex flex-row justify-end gap-2 border-t p-4">
						<Button type="button" variant="outline" onclick={() => (createMediaModalOpen = false)}>
							Cancel
						</Button>
						<Button
							type="button"
							onclick={() => {
								if (createMediaImageUrl.trim()) {
									createMediaUrl = createMediaImageUrl.trim();
									createMediaFile = null;
								}
								if (createMediaChosenFile) {
									createMediaFile = createMediaChosenFile;
									createMediaUrl = '';
								}
								createMediaModalOpen = false;
							}}
						>
							Save
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
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
