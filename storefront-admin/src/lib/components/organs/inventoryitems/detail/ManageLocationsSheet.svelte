<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { client } from '$lib/client.js';
	import { DropdownMenu } from 'bits-ui';

	type InventoryLevel = {
		id: string;
		inventory_item_id: string;
		location_id: string;
		stocked_quantity: number;
		reserved_quantity: number;
		available_quantity: number;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type LevelWithLocation = InventoryLevel & {
		location?: { id: string; name: string | null } | null;
	};

	type ManageLocationsDetail = {
		item: { id: string };
		levels: LevelWithLocation[];
	};

	let {
		open = $bindable(false),
		detail,
		displayName,
		stockLocationsRows,
		stockLocationsPagination,
		stockLocationsStart,
		stockLocationsEnd,
		stockLocationsLoading,
		onStockLocationsPageChange,
		onDetailRefetch
	}: {
		open?: boolean;
		detail: ManageLocationsDetail | null;
		displayName: string;
		stockLocationsRows: { id: string; name: string | null }[];
		stockLocationsPagination: PaginationMeta | null;
		stockLocationsStart: number;
		stockLocationsEnd: number;
		stockLocationsLoading: boolean;
		onStockLocationsPageChange: (pageNum: number) => void;
		onDetailRefetch: () => Promise<void>;
	} = $props();

	let addLocationId = $state('');
	let addStockedQty = $state('0');
	let addReservedQty = $state('0');
	let addAvailableQty = $state('0');
	let levelsSaving = $state(false);
	let levelsError = $state<string | null>(null);
	let levelStockEdit = $state<Record<string, string>>({});
	let levelReservedEdit = $state<Record<string, string>>({});
	let levelAvailableEdit = $state<Record<string, string>>({});
	let deleteLevelModalOpen = $state(false);
	let levelToDelete = $state<InventoryLevel | null>(null);
	let wasOpen = $state(false);

	const existingLocationIds = $derived(new Set((detail?.levels ?? []).map((l) => l.location_id)));
	const locationsToAdd = $derived(
		stockLocationsRows.filter((loc) => !existingLocationIds.has(loc.id))
	);

	const deleteLevelEntityTitle = $derived.by(() => {
		const currentLevel = levelToDelete;
		if (!currentLevel) return '';
		const level = detail?.levels.find((l) => l.id === currentLevel.id);
		return level?.location?.name ?? currentLevel.location_id;
	});

	const stockLocationsColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'ID', key: 'id', type: 'text' }
	];

	function syncEditsFromDetail() {
		const levels = detail?.levels;
		if (!levels?.length) {
			levelStockEdit = {};
			levelReservedEdit = {};
			levelAvailableEdit = {};
			return;
		}
		levelStockEdit = Object.fromEntries(levels.map((l) => [l.id, String(l.stocked_quantity)]));
		levelReservedEdit = Object.fromEntries(levels.map((l) => [l.id, String(l.reserved_quantity)]));
		levelAvailableEdit = Object.fromEntries(levels.map((l) => [l.id, String(l.available_quantity)]));
	}

	$effect(() => {
		if (open && !wasOpen) {
			levelsError = null;
			addLocationId = '';
			addStockedQty = '0';
			addReservedQty = '0';
			addAvailableQty = '0';
			syncEditsFromDetail();
		}
		wasOpen = open;
	});

	async function addLevel() {
		if (!detail?.item?.id || !addLocationId) return;
		levelsError = null;
		levelsSaving = true;
		try {
			const stocked = Math.max(0, parseInt(addStockedQty, 10) || 0);
			const reserved = Math.max(0, parseInt(addReservedQty, 10) || 0);
			const available_quantity = Math.max(0, stocked - reserved);
			const res = await client.inventory.levels.post({
				inventory_item_id: detail.item.id,
				location_id: addLocationId,
				stocked_quantity: stocked,
				reserved_quantity: reserved,
				available_quantity
			});
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to add inventory level'));
			}
			addLocationId = '';
			addStockedQty = '0';
			addReservedQty = '0';
			addAvailableQty = '0';
			await onDetailRefetch();
			syncEditsFromDetail();
		} catch (e) {
			levelsError = e instanceof Error ? e.message : String(e);
		} finally {
			levelsSaving = false;
		}
	}

	async function saveAllLevels() {
		if (!detail?.item?.id || !detail.levels.length) return;
		levelsError = null;
		levelsSaving = true;
		try {
			for (const level of detail.levels) {
				const stocked = Math.max(0, parseInt(levelStockEdit[level.id] ?? '', 10) || 0);
				const reserved = Math.max(0, parseInt(levelReservedEdit[level.id] ?? '', 10) || 0);
				const available_quantity = Math.max(0, stocked - reserved);
				const res = await client.inventory.levels.post({
					inventory_item_id: detail.item.id,
					location_id: level.location_id,
					stocked_quantity: stocked,
					reserved_quantity: reserved,
					available_quantity
				});
				if (res?.error) {
					throw new Error(String(res?.error?.value?.message ?? 'Failed to save inventory levels'));
				}
			}
			await onDetailRefetch();
			syncEditsFromDetail();
		} catch (e) {
			levelsError = e instanceof Error ? e.message : String(e);
		} finally {
			levelsSaving = false;
		}
	}

	async function deleteLevel(level: InventoryLevel) {
		levelsError = null;
		levelsSaving = true;
		try {
			const res = await client.inventory.levels({ id: level.id }).delete();
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to delete inventory level'));
			}
			await onDetailRefetch();
			syncEditsFromDetail();
		} catch (e) {
			levelsError = e instanceof Error ? e.message : String(e);
		} finally {
			levelsSaving = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
				<Sheet.Title>Manage locations</Sheet.Title>
				<Sheet.Description class="text-sm text-muted-foreground">
					{detail ? `${displayName} – stock levels by location` : ''}
				</Sheet.Description>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if detail}
					{#if levelsError}
						<div
							class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{levelsError}
						</div>
					{/if}

					<div class="mb-6">
						<p class="mb-2 text-sm font-medium">Stock for this item</p>
						{#if detail.levels.length === 0}
							<div
								class="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground"
							>
								No stock at any location yet. Use <span class="font-medium text-foreground">Add stock</span> below.
							</div>
						{:else}
							<div class="overflow-auto rounded-lg border">
								<table class="w-full text-sm">
									<thead class="border-b bg-muted/50">
										<tr>
											<th class="px-3 py-2 text-left font-medium">Location</th>
											<th class="px-3 py-2 text-left font-medium">Reserved</th>
											<th class="px-3 py-2 text-left font-medium">In stock</th>
											<th class="px-3 py-2 text-left font-medium">Available</th>
											<th class="w-10 px-3 py-2"></th>
										</tr>
									</thead>
									<tbody>
										{#each detail.levels as level (level.id)}
											<tr class="border-b last:border-0">
												<td class="px-3 py-2 text-xs">{level.location?.name ?? level.location_id}</td>
												<td class="px-3 py-2">
													<Input
														type="number"
														min="0"
														class="h-8 w-16"
														value={levelReservedEdit[level.id] ?? level.reserved_quantity}
														oninput={(e) => {
															const v = (e.currentTarget as HTMLInputElement).value;
															const sid = level.id;
															const stock =
																parseInt(levelStockEdit[sid] ?? String(level.stocked_quantity), 10) || 0;
															levelReservedEdit = { ...levelReservedEdit, [sid]: v };
															levelAvailableEdit = {
																...levelAvailableEdit,
																[sid]: String(Math.max(0, stock - (parseInt(v, 10) || 0)))
															};
														}}
													/>
												</td>
												<td class="px-3 py-2">
													<Input
														type="number"
														min="0"
														class="h-8 w-16"
														value={levelStockEdit[level.id] ?? level.stocked_quantity}
														oninput={(e) => {
															const v = (e.currentTarget as HTMLInputElement).value;
															const sid = level.id;
															const res =
																parseInt(levelReservedEdit[sid] ?? String(level.reserved_quantity), 10) ||
																0;
															levelStockEdit = { ...levelStockEdit, [sid]: v };
															levelAvailableEdit = {
																...levelAvailableEdit,
																[sid]: String(Math.max(0, (parseInt(v, 10) || 0) - res))
															};
														}}
													/>
												</td>
												<td class="px-3 py-2">
													<Input
														type="number"
														min="0"
														class="h-8 w-16"
														value={levelAvailableEdit[level.id] ?? String(level.available_quantity)}
														oninput={(e) => {
															const v = (e.currentTarget as HTMLInputElement).value;
															const sid = level.id;
															const res =
																parseInt(levelReservedEdit[sid] ?? String(level.reserved_quantity), 10) ||
																0;
															levelAvailableEdit = { ...levelAvailableEdit, [sid]: v };
															levelStockEdit = {
																...levelStockEdit,
																[sid]: String((parseInt(v, 10) || 0) + res)
															};
														}}
													/>
												</td>
												<td class="px-3 py-2">
													<DropdownMenu.Root>
														<DropdownMenu.Trigger
															class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
															disabled={levelsSaving}
														>
															<MoreHorizontal class="size-4" />
															<span class="sr-only">Actions</span>
														</DropdownMenu.Trigger>
														<DropdownMenu.Portal>
															<DropdownMenu.Content
																class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
																sideOffset={4}
															>
																<DropdownMenu.Item
																	textValue="Remove"
																	class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
																	onSelect={() => {
																		levelToDelete = level;
																		deleteLevelModalOpen = true;
																	}}
																>
																	<Trash2 class="size-4" />
																	Remove
																</DropdownMenu.Item>
															</DropdownMenu.Content>
														</DropdownMenu.Portal>
													</DropdownMenu.Root>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</div>

					<div class="mb-6 flex flex-col gap-3 rounded-lg border p-4">
						<p class="text-sm font-medium">Add stock at a location</p>
						<p class="text-xs text-muted-foreground">
							Choose a store location, set quantities, then add. Edit existing rows under <span
								class="font-medium text-foreground">Stock for this item</span
							>.
						</p>
						<div class="flex flex-wrap items-end gap-3">
							<div class="min-w-0 space-y-1.5">
								<label for="add-location" class="text-xs text-muted-foreground">Location</label>
								<select
									id="add-location"
									bind:value={addLocationId}
									class="flex h-9 w-full min-w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<option value="">Select location…</option>
									{#each locationsToAdd as loc (loc.id)}
										<option value={loc.id}>{loc.name ?? loc.id}</option>
									{/each}
								</select>
							</div>
							<div class="min-w-0 space-y-1.5">
								<label for="add-reserved" class="text-xs text-muted-foreground">Reserved</label>
								<Input
									id="add-reserved"
									type="number"
									min="0"
									class="h-9 w-20"
									value={addReservedQty}
									oninput={(e) => {
										const v = (e.currentTarget as HTMLInputElement).value;
										addReservedQty = v;
										addAvailableQty = String(
											Math.max(0, (parseInt(addStockedQty, 10) || 0) - (parseInt(v, 10) || 0))
										);
									}}
								/>
							</div>
							<div class="min-w-0 space-y-1.5">
								<label for="add-qty" class="text-xs text-muted-foreground">In stock</label>
								<Input
									id="add-qty"
									type="number"
									min="0"
									class="h-9 w-20"
									value={addStockedQty}
									oninput={(e) => {
										const v = (e.currentTarget as HTMLInputElement).value;
										addStockedQty = v;
										addAvailableQty = String(
											Math.max(0, (parseInt(v, 10) || 0) - (parseInt(addReservedQty, 10) || 0))
										);
									}}
								/>
							</div>
							<div class="min-w-0 space-y-1.5">
								<label for="add-available" class="text-xs text-muted-foreground">Available</label>
								<Input
									id="add-available"
									type="number"
									min="0"
									class="h-9 w-20"
									value={addAvailableQty}
									oninput={(e) => {
										const v = (e.currentTarget as HTMLInputElement).value;
										addAvailableQty = v;
										addStockedQty = String((parseInt(v, 10) || 0) + (parseInt(addReservedQty, 10) || 0));
									}}
								/>
							</div>
							<Button size="sm" disabled={!addLocationId || levelsSaving} onclick={addLevel}>
								{levelsSaving ? 'Adding…' : 'Add'}
							</Button>
						</div>
						{#if locationsToAdd.length === 0 && stockLocationsRows.length > 0}
							<p class="text-xs text-muted-foreground">
								All locations already have stock for this item.
							</p>
						{/if}
						{#if !stockLocationsLoading && stockLocationsPagination && stockLocationsPagination.total === 0}
							<p class="text-xs text-muted-foreground">
								No store locations exist yet.
								<a href="/inventoryitems/locations" class="font-medium text-primary underline underline-offset-2"
									>Create a location</a
								>
								first, then return here.
							</p>
						{/if}
					</div>

					<div class="mb-2">
						<p class="mb-1 text-sm font-medium">Store locations</p>
						<p class="mb-2 text-xs text-muted-foreground">
							Locations in your catalog (paginate to find one, then select it in Add stock above).
						</p>
						<PaginationTable showToolbar={false}>
							{#if stockLocationsLoading}
								<p class="py-4 text-sm text-muted-foreground">Loading…</p>
							{:else}
								<div class="overflow-auto rounded-lg border">
									<table class="w-full text-sm">
										<TableHead columns={stockLocationsColumns} />
										<TableBody
											rows={stockLocationsRows}
											columns={stockLocationsColumns}
											emptyMessage="No locations on this page."
										/>
									</table>
								</div>
								<TablePagination
									pagination={stockLocationsPagination}
									start={stockLocationsStart}
									end={stockLocationsEnd}
									onPageChange={onStockLocationsPageChange}
								/>
							{/if}
						</PaginationTable>
					</div>
				{:else}
					<p class="py-8 text-center text-sm text-muted-foreground">Loading item details…</p>
				{/if}
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (open = false)}>Close</Button>
				<Button disabled={levelsSaving || !detail?.levels?.length} onclick={saveAllLevels}>
					{levelsSaving ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={deleteLevelModalOpen}
	entityName="location stock"
	entityTitle={deleteLevelEntityTitle}
	customMessage="Remove this inventory level? Stock at this location will no longer be tracked for this item."
	onConfirm={async () => {
		if (levelToDelete) {
			await deleteLevel(levelToDelete);
			deleteLevelModalOpen = false;
			levelToDelete = null;
		}
	}}
	onCancel={() => {
		deleteLevelModalOpen = false;
		levelToDelete = null;
	}}
	submitting={levelsSaving}
/>
