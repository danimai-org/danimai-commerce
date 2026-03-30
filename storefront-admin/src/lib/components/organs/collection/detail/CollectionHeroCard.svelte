<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import { Button } from '$lib/components/ui/button/index.js';
	import { getDetailContext } from '$lib/hooks';
	import type { Collection } from '../type.js';
	import EditCollectionHero from '$lib/components/organs/collection/update/EditCollectionHero.svelte';
	let formSheetOpen = $state(false);

	const detailQuery = getDetailContext<Collection>();

	const collection = $derived(detailQuery?.data ?? null);

	function getHandle(c: Collection | null): string {
		if (!c) return '';
		return c.handle?.startsWith('/') ? c.handle : `/${c.handle ?? ''}`;
	}
</script>

<div class="flex min-h-0 flex-col overflow-auto">
	<div class="flex flex-col gap-6 p-6">
		<div class="rounded-lg border bg-card p-8 shadow-sm">
			<div class="flex items-start justify-between gap-4">
				<div class="space-y-6">
					<h1 class="text-3xl font-semibold tracking-tight">
						{(collection?.title as string | undefined) ?? ''}
					</h1>
					<div class="grid gap-4 text-sm sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start">
						<span class="pt-0.5 font-medium text-muted-foreground">Handle</span>
						<p class="font-mono text-foreground">{getHandle(collection)}</p>
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					class="size-8 shrink-0"
					onclick={() => (formSheetOpen = true)}
					aria-label="Edit collection"
				>
					<Pencil class="size-4" />
				</Button>
			</div>
		</div>
	</div>
</div>

<EditCollectionHero
	bind:open={formSheetOpen}
	{collection}
	onSuccess={() => {
		void detailQuery?.refetch?.();
	}}
/>
