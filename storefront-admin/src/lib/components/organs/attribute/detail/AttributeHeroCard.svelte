<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { getDetailContext } from '$lib/hooks';
	import type { Attribute } from '../type.js';
	import EditAttributeHero from '$lib/components/organs/attribute/update/EditAttributeHero.svelte';

	const detailQuery = getDetailContext<Attribute>();
	let formSheetOpen = $state(false);
</script>

<div class="flex min-h-0 flex-col overflow-auto">
	<div class="flex flex-col gap-6 p-6">
		<div class="rounded-lg border bg-card p-8 shadow-sm">
			<div class="flex items-start justify-between gap-4">
				<div class="space-y-6">
					<div class="flex items-center gap-2">
						<ListFilter class="size-5 text-muted-foreground" />
						<h1 class="text-3xl font-semibold tracking-tight">
							{detailQuery?.data?.title ?? 'Attribute'}
						</h1>
					</div>
					<div class="grid gap-4 text-sm sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start">
						<span class="pt-0.5 font-medium text-muted-foreground">Type</span>
						<p class="font-medium text-foreground">{detailQuery?.data?.type ?? '—'}</p>
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					class="size-8 shrink-0"
					onclick={() => (formSheetOpen = true)}
					aria-label="Edit attribute"
					disabled={!detailQuery?.data}
				>
					<Pencil class="size-4" />
				</Button>
			</div>
		</div>
	</div>
</div>
<EditAttributeHero
	bind:open={formSheetOpen}
	attribute={detailQuery?.data ?? null}
	onSuccess={() => {
		void detailQuery?.refetch?.();
	}}
/>
