<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';

	interface Props {
		open: boolean;
		variantTitle: string;
		imageUrl: string;
		error: string | null;
		submitting: boolean;
		onImageUrlChange: (v: string) => void;
		onCancel: () => void;
		onSave: () => void;
	}

	let {
		open = $bindable(false),
		variantTitle,
		imageUrl,
		error,
		submitting,
		onImageUrlChange,
		onCancel,
		onSave
	}: Props = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md">
		<Sheet.Header class="border-b px-6 py-4">
			<Sheet.Title>Select image</Sheet.Title>
			{#if variantTitle}
				<Sheet.Description class="text-sm text-muted-foreground">
					{variantTitle}
				</Sheet.Description>
			{/if}
		</Sheet.Header>
		<div class="flex flex-col gap-4 p-6">
			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
			<div class="flex flex-col gap-2">
				<label for="variant-image-url" class="text-sm font-medium">Image URL</label>
				<Input
					id="variant-image-url"
					type="url"
					placeholder="https://..."
					value={imageUrl}
					oninput={(e) => onImageUrlChange((e.currentTarget as HTMLInputElement).value)}
					class="w-full"
				/>
			</div>
			{#if imageUrl}
				<div class="flex justify-center rounded-md border bg-muted/30 p-4">
					<img
						src={imageUrl}
						alt="Preview"
						class="max-h-40 rounded object-contain"
						onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
					/>
				</div>
			{/if}
		</div>
		<div class="flex justify-end gap-2 border-t p-4">
			<Button variant="outline" onclick={onCancel}>Cancel</Button>
			<Button onclick={onSave} disabled={submitting}>
				{submitting ? 'Saving…' : 'Save'}
			</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>
