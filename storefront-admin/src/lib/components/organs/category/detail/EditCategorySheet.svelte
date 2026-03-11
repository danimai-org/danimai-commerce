<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Info from '@lucide/svelte/icons/info';
	import { client } from '$lib/client.js';
	import type { ProductCategory } from '$lib/product-categories/types.js';
	import { cn } from '$lib/utils.js';

	interface Props {
		open?: boolean;
		category: ProductCategory | null;
		onUpdated?: () => void | Promise<void>;
	}

	let { open = $bindable(false), category, onUpdated = () => {} }: Props = $props();

	let editTitle = $state('');
	let editHandle = $state('');
	let editDescription = $state('');
	let editStatus = $state<'active' | 'inactive'>('active');
	let editVisibility = $state<'public' | 'private'>('public');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	$effect(() => {
		if (open && category) {
			editTitle = category.value;
			editHandle = category.handle?.replace(/^\//, '') ?? '';
			editDescription =
				typeof category.metadata === 'object' &&
				category.metadata !== null &&
				'description' in category.metadata
					? String((category.metadata as { description?: string }).description ?? '')
					: '';
			editStatus = (category.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive';
			editVisibility = (category.visibility === 'private' ? 'private' : 'public') as
				| 'public'
				| 'private';
			editError = null;
		}
	});

	function closeSheet() {
		open = false;
		editError = null;
	}

	async function submit() {
		if (!category) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const body: {
				value: string;
				parent_id?: string;
				status?: string;
				visibility?: string;
				metadata?: Record<string, string | number>;
			} = {
				value: editTitle.trim(),
				status: editStatus,
				visibility: editVisibility
			};
			if (category.parent_id) body.parent_id = category.parent_id;
			if (editDescription.trim()) body.metadata = { description: editDescription.trim() };
			const res = await client['product-categories']({ id: category.id }).put(body);
			if (!res.error) {
				closeSheet();
				await onUpdated();
			} else {
				const err = res.error as { value?: { message?: string } };
				editError = err?.value?.message ?? 'Failed to update';
			}
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<div class="flex flex-col gap-6">
					<div>
						<h2 class="text-lg font-semibold">Edit Category</h2>
						<p class="mt-1 text-sm text-muted-foreground">Update category details.</p>
					</div>

					{#if editError}
						<div
							class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{editError}
						</div>
					{/if}
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<label for="edit-cat-title" class="text-sm font-medium">Title</label>
							<Input
								id="edit-cat-title"
								bind:value={editTitle}
								placeholder="Enter category title"
								class={cn('h-9', editError && !editTitle.trim() && 'border-destructive')}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-cat-handle" class="flex items-center gap-1.5 text-sm font-medium">
								Handle
								<span class="font-normal text-muted-foreground">(Optional)</span>
								<Tooltip.Root>
									<Tooltip.Trigger
										class="rounded-full text-muted-foreground hover:text-foreground"
										aria-label="Handle info"
									>
										<Info class="size-3.5" />
									</Tooltip.Trigger>
									<Tooltip.Content>Leave empty to auto-generate from title.</Tooltip.Content>
								</Tooltip.Root>
							</label>
							<div class="relative">
								<span class="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">/</span>
								<Input
									id="edit-cat-handle"
									bind:value={editHandle}
									placeholder="handle"
									class="h-9 pl-6"
								/>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-cat-description" class="text-sm font-medium">
								Description
								<span class="font-normal text-muted-foreground">(Optional)</span>
							</label>
							<textarea
								id="edit-cat-description"
								bind:value={editDescription}
								placeholder="Enter description"
								rows="4"
								class="flex w-full min-w-0 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							></textarea>
						</div>
						<div class="flex flex-col gap-2">
							<label for="edit-cat-visibility" class="text-sm font-medium">Visibility</label>
							<select
								id="edit-cat-visibility"
								bind:value={editVisibility}
								class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="public">Public</option>
								<option value="private">Private</option>
							</select>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeSheet} disabled={editSubmitting}>Cancel</Button>
				<Button onclick={submit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
