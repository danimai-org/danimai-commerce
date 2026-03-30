<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { SalesChannel } from '../type';
	import EditSaleChannel from '$lib/components/organs/sales-channel/update/EditSaleChannel.svelte';
	import { getDetailContext } from '$lib/hooks';

	let formSheetOpen = $state(false);

	const detailQuery = getDetailContext<SalesChannel>();
	const channel = $derived(detailQuery?.data ?? null);
</script>

<div class="flex min-h-0 flex-col overflow-auto">
	<div class="flex flex-col gap-6 p-6">
		<div class="rounded-lg border bg-card p-8 shadow-sm">
			<div class="flex items-start justify-between gap-4">
				<div class="space-y-6">
					<h1 class="text-3xl font-semibold tracking-tight">{channel?.name ?? ''}</h1>
					<div class="grid gap-4 text-sm sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start">
						<span class="pt-0.5 font-medium text-muted-foreground">Description</span>
						{#if channel?.description}
							<p class="text-foreground">{channel.description}</p>
						{:else}
							<p class="text-muted-foreground">No description</p>
						{/if}
					</div>
				</div>
				<div class="flex flex-col items-end gap-3">
					<Button
						variant="ghost"
						size="icon"
						class="size-8 shrink-0"
						onclick={() => (formSheetOpen = true)}
						aria-label="Edit sales channel"
					>
						<Pencil class="size-4" />
					</Button>
					<span
						class={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${channel?.is_default ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
					>
						{channel?.is_default ? 'Default' : 'Not default'}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
<EditSaleChannel
	bind:open={formSheetOpen}
	mode="edit"
	{channel}
	onSuccess={() => {
		void detailQuery?.refetch?.();
	}}
/>
