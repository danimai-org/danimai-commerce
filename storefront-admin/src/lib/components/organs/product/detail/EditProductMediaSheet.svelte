<script lang="ts">
	import { untrack } from 'svelte';
	import { client } from '$lib/client';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	interface Props {
		open: boolean;
		productId: string;
		thumbnail: string;
		onSaved: () => void | Promise<void>;
	}

	let { open = $bindable(false), productId, thumbnail, onSaved }: Props = $props();

	let imageUrl = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);
	let prevOpen = $state(false);

	$effect(() => {
		if (open && !prevOpen) {
			imageUrl = untrack(() => thumbnail);
			error = null;
		}
		prevOpen = open;
	});

	function close() {
		open = false;
		error = null;
	}

	async function save() {
		if (!productId) {
			error = 'Missing product id.';
			return;
		}
		error = null;
		submitting = true;
		try {
			const trimmed = imageUrl.trim();
			const res = await client.products({ id: productId }).put({
				thumbnail: trimmed || undefined
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

	async function removeImage() {
		if (!productId) return;
		error = null;
		submitting = true;
		try {
			const res = await client.products({ id: productId }).put({
				thumbnail_media_id: null
			});
			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				throw new Error(err?.value?.message ?? String(res.error));
			}
			imageUrl = '';
			close();
			await onSaved();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md">
		<Sheet.Header class="border-b px-6 py-4">
			<Sheet.Title>Edit media</Sheet.Title>
			<Sheet.Description class="text-sm text-muted-foreground">
				Set the product thumbnail image URL shown in listings and the storefront.
			</Sheet.Description>
		</Sheet.Header>
		<div class="flex flex-col gap-4 p-6">
			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
			<div class="flex flex-col gap-2">
				<label for="product-media-url" class="text-sm font-medium">Image URL</label>
				<Input
					id="product-media-url"
					type="url"
					placeholder="https://…"
					bind:value={imageUrl}
					class="w-full"
				/>
			</div>
			{#if imageUrl.trim()}
				<div class="flex justify-center rounded-md border bg-muted/30 p-4">
					<img
						src={imageUrl.trim()}
						alt="Preview"
						class="max-h-40 rounded object-contain"
						onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
					/>
				</div>
			{/if}
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2 border-t p-4">
			<Button
				variant="ghost"
				class="text-destructive hover:bg-destructive/10"
				onclick={removeImage}
				disabled={submitting}
			>
				Remove image
			</Button>
			<div class="flex gap-2">
				<Button variant="outline" onclick={close} disabled={submitting}>Cancel</Button>
				<Button onclick={save} disabled={submitting}>Save</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
