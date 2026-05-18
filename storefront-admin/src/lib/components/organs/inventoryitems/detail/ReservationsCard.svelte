<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import CreateReservationSheet from '../create/CreateReservationSheet.svelte';
	import type { InventoryLevelWithLocation, ReservationItemEntity } from '../type.js';

	let {
		inventoryItemId,
		inventoryItemLabel,
		levels,
		stockLocationNameById,
		variantTitle = null,
		variantSku = null,
		itemSku = null,
		reservations = [],
		onReservationCreated = async () => {}
	}: {
		inventoryItemId: string;
		inventoryItemLabel: string;
		levels: InventoryLevelWithLocation[];
		stockLocationNameById?: ReadonlyMap<string, string>;
		variantTitle?: string | null;
		variantSku?: string | null;
		itemSku?: string | null;
		reservations?: ReservationItemEntity[];
		onReservationCreated?: () => Promise<void>;
	} = $props();

	let createOpen = $state(false);

	function locationNameForId(locationId: string): string {
		const fromMap = stockLocationNameById?.get(locationId)?.trim();
		if (fromMap) return fromMap;
		const level = levels.find((l) => l.location_id === locationId);
		return level?.location?.name?.trim() || locationId;
	}
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">Reservations</h2>
		<Button variant="outline" size="sm" type="button" onclick={() => (createOpen = true)}
			>Create</Button
		>
	</div>

	{#if reservations.length > 0}
		<div class="mt-4 min-h-0 overflow-auto rounded-lg border">
			<table class="w-full text-sm">
				<thead class="sticky top-0 border-b bg-muted/50">
					<tr>
						<th class="px-4 py-3 text-left font-medium">Location</th>
						<th class="px-4 py-3 text-left font-medium">Quantity</th>
						<th class="px-4 py-3 text-left font-medium">Description</th>
					</tr>
				</thead>
				<tbody>
					{#each reservations as row (row.id)}
						<tr class="border-b transition-colors last:border-b-0 hover:bg-muted/30">
							<td class="px-4 py-3 font-medium">{locationNameForId(row.location_id)}</td>
							<td class="px-4 py-3 font-medium">{row.quantity}</td>
							<td class="px-4 py-3 text-muted-foreground">{row.description ?? '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="mt-4 py-8 text-center text-sm text-muted-foreground">No reservations.</div>
	{/if}
</div>

<CreateReservationSheet
	bind:open={createOpen}
	inventoryItems={[{ id: inventoryItemId, label: inventoryItemLabel }]}
	{levels}
	{stockLocationNameById}
	{variantTitle}
	{variantSku}
	{itemSku}
	onCreated={onReservationCreated}
/>
