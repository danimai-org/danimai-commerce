<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { client } from '$lib/client.js';
	import { cn } from '$lib/utils.js';
	import type { InventoryLevelWithLocation } from '../type.js';

	let {
		open = $bindable(false),
		inventoryItems,
		levels,
		variantTitle = null,
		variantSku = null,
		itemSku = null,
		onCreated = async () => {}
	}: {
		open?: boolean;
		inventoryItems: { id: string; label: string }[];
		levels: InventoryLevelWithLocation[];
		variantTitle?: string | null;
		variantSku?: string | null;
		itemSku?: string | null;
		onCreated?: () => Promise<void>;
	} = $props();

	let selectedItemId = $state('');
	let selectedLocationId = $state('');
	let quantityInput = $state('');
	let description = $state('');
	let saving = $state(false);
	let formError = $state<string | null>(null);
	let wasOpen = $state(false);

	function locationLabel(level: InventoryLevelWithLocation): string {
		return level.location?.name?.trim() || level.location_id;
	}

	const selectedLevel = $derived(
		levels.find((l) => l.location_id === selectedLocationId) ?? null
	);

	const summaryTitle = $derived(variantTitle ?? '—');
	const summarySku = $derived(variantSku ?? itemSku ?? '—');
	const summaryStocked = $derived(selectedLevel != null ? String(selectedLevel.stocked_quantity) : '—');
	const summaryAvailable = $derived(selectedLevel != null ? String(selectedLevel.available_quantity) : '—');

	const quantityNum = $derived(Math.max(0, parseInt(quantityInput, 10) || 0));
	const maxReservable = $derived(selectedLevel?.available_quantity ?? 0);
	const canSubmit = $derived(
		selectedLocationId !== '' &&
			quantityNum > 0 &&
			quantityNum <= maxReservable &&
			selectedItemId !== '' &&
			!saving
	);

	function resetForm() {
		selectedItemId = inventoryItems[0]?.id ?? '';
		selectedLocationId = levels[0]?.location_id ?? '';
		quantityInput = '';
		description = '';
		formError = null;
	}

	$effect(() => {
		if (open && !wasOpen) {
			resetForm();
		}
		wasOpen = open;
	});

	$effect(() => {
		if (levels.length && !levels.some((l) => l.location_id === selectedLocationId)) {
			selectedLocationId = levels[0]?.location_id ?? '';
		}
	});

	function close() {
		open = false;
	}

	async function handleCreate() {
		if (!canSubmit || !selectedLevel) return;
		formError = null;
		saving = true;
		try {
			const res = await client.inventory['reservation-items'].post({
				inventory_item_id: selectedItemId,
				location_id: selectedLocationId,
				quantity: quantityNum,
				description: description.trim() ? description.trim() : null,
				line_item_id: null
			});
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to create reservation'));
			}
			close();
			await onCreated();
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
				<Sheet.Title>Create reservation</Sheet.Title>
			</Sheet.Header>

			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if formError}
					<div
						class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{formError}
					</div>
				{/if}

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Item to reserve</span>
						<Select.Root
							type="single"
							value={selectedItemId}
							onValueChange={(v) => {
								if (v) selectedItemId = v;
							}}
							disabled={inventoryItems.length <= 1}
						>
							<Select.Trigger class="w-full">
								<span class="flex w-full items-center justify-between gap-2 truncate">
									<span class="truncate"
										>{inventoryItems.find((i) => i.id === selectedItemId)?.label ?? 'Select item'}</span
									>
									<ChevronDown class="size-4 shrink-0 opacity-50" />
								</span>
							</Select.Trigger>
							<Select.Content>
								{#each inventoryItems as item (item.id)}
									<Select.Item value={item.id} label={item.label}>{item.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Location</span>
						{#if levels.length === 0}
							<p class="text-sm text-muted-foreground">Add stock at a location first.</p>
						{:else}
							<Select.Root
								type="single"
								value={selectedLocationId}
								onValueChange={(v) => {
									if (v) selectedLocationId = v;
								}}
							>
								<Select.Trigger class="w-full">
									<span class="flex w-full items-center justify-between gap-2 truncate">
										<span class="truncate"
											>{selectedLevel ? locationLabel(selectedLevel) : 'Select location'}</span
										>
										<ChevronDown class="size-4 shrink-0 opacity-50" />
									</span>
								</Select.Trigger>
								<Select.Content>
									{#each levels as level (level.id)}
										<Select.Item value={level.location_id} label={locationLabel(level)}
											>{locationLabel(level)}</Select.Item
										>
									{/each}
								</Select.Content>
							</Select.Root>
						{/if}
					</div>
				</div>

				<div class="mt-4 overflow-hidden rounded-lg border">
					<table class="w-full text-sm">
						<tbody>
							<tr class="border-b">
								<td class="px-3 py-2 text-muted-foreground">Title</td>
								<td class="px-3 py-2 font-medium">{summaryTitle}</td>
							</tr>
							<tr class="border-b">
								<td class="px-3 py-2 text-muted-foreground">SKU</td>
								<td class="px-3 py-2 font-medium">{summarySku}</td>
							</tr>
							<tr class="border-b">
								<td class="px-3 py-2 text-muted-foreground">In stock</td>
								<td class="px-3 py-2 font-medium">{summaryStocked}</td>
							</tr>
							<tr>
								<td class="px-3 py-2 text-muted-foreground">Available</td>
								<td class="px-3 py-2 font-medium">{summaryAvailable}</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div class="mt-4 flex flex-col gap-2">
					<label for="reservation-qty" class="text-sm font-medium">Quantity</label>
					<Input
						id="reservation-qty"
						type="number"
						min="1"
						max={maxReservable > 0 ? maxReservable : undefined}
						placeholder="How much do you want to reserve?"
						bind:value={quantityInput}
						class="h-9"
						disabled={!selectedLevel || maxReservable === 0}
					/>
					{#if selectedLevel && maxReservable === 0}
						<p class="text-xs text-muted-foreground">No available quantity at this location.</p>
					{:else if selectedLevel && quantityNum > maxReservable}
						<p class="text-xs text-destructive">
							Cannot exceed {maxReservable} available.
						</p>
					{/if}
				</div>

				<div class="mt-4 flex flex-col gap-2">
					<label for="reservation-desc" class="text-sm font-medium">
						Description <span class="font-normal text-muted-foreground">(Optional)</span>
					</label>
					<textarea
						id="reservation-desc"
						rows="3"
						bind:value={description}
						placeholder="What type of reservation is this?"
						class={cn(
							'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
						)}
					></textarea>
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={close} disabled={saving}>Cancel</Button>
				<Button type="button" onclick={handleCreate} disabled={!canSubmit}>
					{saving ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
