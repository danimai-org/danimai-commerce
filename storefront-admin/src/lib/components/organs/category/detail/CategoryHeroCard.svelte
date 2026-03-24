<!-- <script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EditCategorySheet from '../update/EditCategoryHero.svelte';
	import { cn } from '$lib/utils.js';
	import { client } from '$lib/client.js';

	type CategoryGetResponse = Awaited<
		ReturnType<ReturnType<(typeof client)['product-categories']>['get']>
	>;
	type Category = CategoryGetResponse extends { data: infer Data } ? Data : never;

	interface Props {
		category: Category | null;
		onUpdated?: () => void | Promise<void>;
	}

	let { category = null, onUpdated = () => {} }: Props = $props();

	let editSheetOpen = $state(false);

	function getHandle(c: Category | null): string {
		if (!c) return '';
		return c.handle?.startsWith('/') ? c.handle : `/${c.handle ?? ''}`;
	}

	function metadataDescription(meta: unknown): string | undefined {
		if (meta == null || typeof meta !== 'object' || Array.isArray(meta)) return undefined;
		const d = Reflect.get(meta, 'description');
		return d != null && d !== '' ? String(d) : undefined;
	}

	function getDescription(c: Category | null): string {
		const desc = c ? metadataDescription(c.metadata) : undefined;
		return desc != null ? desc : '—';
	}

	const selectedCategory = $derived.by(() => {
		if (!category) return null;
		return category;
	});
</script>

<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6 pb-8">
		<div class="flex items-center justify-between gap-4">
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="text-2xl font-semibold tracking-tight">{selectedCategory?.value ?? '—'}</h1>
				{#if selectedCategory}
					<span
						class={cn(
							'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
							selectedCategory.visibility === 'public' &&
								'bg-green-500/10 text-green-700 dark:text-green-400',
							selectedCategory.visibility === 'private' && 'bg-muted text-muted-foreground'
						)}
					>
						<span
							class={cn(
								'size-1.5 shrink-0 rounded-sm bg-current opacity-70',
								selectedCategory.visibility === 'public' && 'bg-green-600',
								selectedCategory.visibility === 'private' && 'bg-muted-foreground'
							)}
						></span>
						{selectedCategory.visibility === 'public' ? 'Public' : 'Private'}
					</span>
				{/if}
			</div>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				onclick={() => (editSheetOpen = true)}
				aria-label="Edit category"
				disabled={!selectedCategory}
			>
				<Pencil class="size-4" />
			</Button>
		</div>
	</section>
	<div class="rounded-lg bg-card p-6">
		<dl class="mt-4 grid gap-3 text-sm">
			<div class="flex justify-between gap-4">
				<dt class="shrink-0 font-medium text-muted-foreground">Description</dt>
				<dd class="text-right">{getDescription(selectedCategory)}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="shrink-0 font-medium text-muted-foreground">Handle</dt>
				<dd class="text-right">{getHandle(selectedCategory)}</dd>
			</div>
		</dl>
	</div>
</div>

<EditCategorySheet
	category={editSheetOpen ? selectedCategory : null}
	onSaved={async () => {
		await onUpdated();
		editSheetOpen = false; // Sync parent state on successful save
	}}
	onClosed={() => {
		editSheetOpen = false; // Reset state when user clicks backdrop/X
	}}
/> -->

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import EditCategorySheet from '../update/EditCategoryHero.svelte';
	import { cn } from '$lib/utils.js';
	import { client } from '$lib/client.js';

	type CategoryGetResponse = Awaited<
		ReturnType<ReturnType<(typeof client)['product-categories']>['get']>
	>;
	type Category = CategoryGetResponse extends { data: infer Data } ? Data : never;

	interface Props {
		category: Category | null;
		onUpdated?: () => void | Promise<void>;
	}

	let { category = null, onUpdated = () => {} }: Props = $props();

	let editSheetOpen = $state(false);

	// Helpers
	function getHandle(c: Category | null): string {
		if (!c) return '';
		return c.handle?.startsWith('/') ? c.handle : `/${c.handle ?? ''}`;
	}

	function metadataDescription(meta: unknown): string | undefined {
		if (meta == null || typeof meta !== 'object' || Array.isArray(meta)) return undefined;
		const d = Reflect.get(meta, 'description');
		return d != null && d !== '' ? String(d) : undefined;
	}

	function getDescription(c: Category | null): string {
		const desc = c ? metadataDescription(c.metadata) : undefined;
		return desc != null ? desc : '—';
	}

	const selectedCategory = $derived.by(() => {
		return category;
	});
</script>

<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6 pb-8">
		<div class="flex items-center justify-between gap-4">
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="text-2xl font-semibold tracking-tight">{selectedCategory?.value ?? '—'}</h1>
				{#if selectedCategory}
					<span
						class={cn(
							'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
							selectedCategory.visibility === 'public' &&
								'bg-green-500/10 text-green-700 dark:text-green-400',
							selectedCategory.visibility === 'private' && 'bg-muted text-muted-foreground'
						)}
					>
						<span
							class={cn(
								'size-1.5 shrink-0 rounded-sm bg-current opacity-70',
								selectedCategory.visibility === 'public' && 'bg-green-600',
								selectedCategory.visibility === 'private' && 'bg-muted-foreground'
							)}
						></span>
						{selectedCategory.visibility === 'public' ? 'Public' : 'Private'}
					</span>
				{/if}
			</div>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				onclick={() => (editSheetOpen = true)}
				aria-label="Edit category"
				disabled={!selectedCategory}
			>
				<Pencil class="size-4" />
			</Button>
		</div>
	</section>

	<div class="rounded-lg bg-card p-6">
		<dl class="mt-4 grid gap-3 text-sm">
			<div class="flex justify-between gap-4">
				<dt class="shrink-0 font-medium text-muted-foreground">Description</dt>
				<dd class="text-right">{getDescription(selectedCategory)}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="shrink-0 font-medium text-muted-foreground">Handle</dt>
				<dd class="text-right">{getHandle(selectedCategory)}</dd>
			</div>
		</dl>
	</div>
</div>

<EditCategorySheet
	category={editSheetOpen ? selectedCategory : null}
	onSaved={async () => {
		await onUpdated();
		editSheetOpen = false;
	}}
	onClosed={() => {
		editSheetOpen = false;
	}}
/>
