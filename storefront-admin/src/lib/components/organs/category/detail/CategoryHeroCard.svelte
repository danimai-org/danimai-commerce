<script lang="ts">
	import { cn } from '$lib/utils.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { Button } from '$lib/components/ui/button/index.js';
	import { getDetailContext } from '$lib/hooks';
	import type { Category } from '../type';
	import EditCategoryHero from '$lib/components/organs/category/update/EditCategoryHero.svelte';
	const detailQuery = getDetailContext<Category>();
	let formSheetOpen = $state(false);
	const category = $derived(detailQuery?.data ?? null);

	function getHandle(c: Category | null): string {
		if (!c) return '';
		return c.handle?.startsWith('/') ? c.handle : `/${c.handle ?? ''}`;
	}

	function metadataDescription(meta: unknown): string | undefined {
		if (meta == null || typeof meta !== 'object' || Array.isArray(meta)) return undefined;
		const d = Reflect.get(meta, 'description');
		return d != null && d !== '' ? String(d) : undefined;
	}

	function getDescription(): string {
		const desc = metadataDescription(category?.metadata);
		return desc != null ? desc : '';
	}

	const categoryName = $derived(category?.value ?? category?.id ?? '');
	const categoryVisibility = $derived(category?.visibility ?? 'public');
	const categoryDescription = $derived(getDescription());
</script>

<div class="w-full min-w-0 lg:min-h-0 lg:flex-1">
	<div class="flex flex-col gap-6">
		<div class="rounded-lg border bg-card p-8 shadow-sm">
			<div class="flex items-start justify-between gap-4">
				<div class="space-y-6">
					<div class="flex flex-wrap items-center gap-2">
						<h1 class="text-3xl font-semibold tracking-tight">{categoryName}</h1>
						{#if categoryVisibility}
							<span
								class={cn(
									'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
									categoryVisibility === 'public' &&
										'bg-green-500/10 text-green-700 dark:text-green-400',
									categoryVisibility === 'private' && 'bg-muted text-muted-foreground'
								)}
							>
								<span
									class={cn(
										'size-1.5 shrink-0 rounded-sm bg-current opacity-70',
										categoryVisibility === 'public' && 'bg-green-600',
										categoryVisibility === 'private' && 'bg-muted-foreground'
									)}
								></span>
								{categoryVisibility === 'public' ? 'Public' : 'Private'}
							</span>
						{/if}
					</div>
					<div class="grid gap-4 text-sm sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start">
						<span class="pt-0.5 font-medium text-muted-foreground">Description</span>
						{#if categoryDescription}
							<p class="text-foreground">{categoryDescription}</p>
						{:else}
							<p class="text-muted-foreground">No description</p>
						{/if}
					</div>
					<div class="grid gap-4 text-sm sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start">
						<span class="pt-0.5 font-medium text-muted-foreground">Handle</span>
						<p class="font-mono text-foreground">{getHandle(category)}</p>
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					class="size-8 shrink-0"
					onclick={() => (formSheetOpen = true)}
					aria-label="Edit category"
				>
					<Pencil class="size-4" />
				</Button>
			</div>
		</div>
	</div>
</div>
<EditCategoryHero
	bind:open={formSheetOpen}
	{category}
	onSuccess={() => {
		void detailQuery?.refetch?.();
	}}
/>
