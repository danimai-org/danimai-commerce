<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Combobox, type ComboboxOption } from '$lib/components/organs/index.js';
	import X from '@lucide/svelte/icons/x';

	type CreateAttributeEntry = { attributeId: string; attributeTitle: string; value: string };

	let {
		createCategoryId = $bindable(''),
		categoryError = null as string | null,
		createAttributeEntries = [] as CreateAttributeEntry[],
		attributesList = [] as {
			id: string;
			title?: string;
			value?: string;
			name?: string;
			type: string;
		}[],
		addAttributeEntry,
		removeAttributeEntry,
		setAttributeEntryAttribute,
		setAttributeEntryValue
	}: {
		createCategoryId: string;
		categoryError: string | null;
		createAttributeEntries: CreateAttributeEntry[];
		attributesList: {
			id: string;
			title?: string;
			value?: string;
			name?: string;
			type: string;
		}[];
		addAttributeEntry: () => void;
		removeAttributeEntry: (index: number) => void;
		setAttributeEntryAttribute: (index: number, attributeId: string) => void;
		setAttributeEntryValue: (entryIndex: number, value: string) => void;
	} = $props();

	function getLabel(item: { title?: string; value?: string; name?: string }): string {
		return item.title ?? item.value ?? item.name ?? '';
	}

	function getAttributeOptions(entryIndex: number): ComboboxOption[] {
		return attributesList
			.filter(
				(a) =>
					!createAttributeEntries.some((e2, i2) => i2 !== entryIndex && e2.attributeId === a.id)
			)
			.map((attr) => ({ id: attr.id, value: getLabel(attr) }))
			.filter((attr) => attr.value.trim());
	}
</script>

<div class="flex-1 overflow-auto p-4 pt-4 sm:p-6 sm:pt-4">
	<h2 class="text-lg font-semibold">Attributes</h2>
	<p class="mt-1 text-sm text-muted-foreground">
		Assign product attributes and their values. Attributes must belong to the product category
		selected in the General step.
	</p>
	<div class="mt-6 flex flex-col gap-4">
		{#if !createCategoryId}
			<p class="text-sm text-muted-foreground">
				Select a category in the General step to add attributes.
			</p>
			{#if categoryError}
				<p class="text-xs text-destructive">{categoryError}</p>
			{/if}
		{:else}
			{#if categoryError}
				<p class="text-xs text-destructive">{categoryError}</p>
			{/if}
			{#each createAttributeEntries as entry, entryIndex (entryIndex)}
				<div class="flex flex-col gap-3 rounded-lg border p-4">
					<div class="flex items-start justify-between gap-2">
						<span class="text-sm font-medium">Attribute {entryIndex + 1}</span>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="size-8 shrink-0"
							onclick={() => removeAttributeEntry(entryIndex)}
							aria-label="Remove attribute"
						>
							<X class="size-4" />
						</Button>
					</div>
					<div class="flex flex-col gap-2">
						<label for="create-attr-select-{entryIndex}" class="text-sm font-medium"
							>Attribute</label
						>
						<Combobox
							id="create-attr-select-{entryIndex}"
							value={entry.attributeId}
							options={getAttributeOptions(entryIndex)}
							placeholder="Select attribute"
							emptyMessage="No attributes found for this category"
							triggerClass="w-full"
							onValueChange={(id) => setAttributeEntryAttribute(entryIndex, id)}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="create-attr-value-{entryIndex}" class="text-sm font-medium">Value</label>
						<Input
							id="create-attr-value-{entryIndex}"
							value={entry.value}
							placeholder="Enter value"
							oninput={(e) => setAttributeEntryValue(entryIndex, e.currentTarget.value)}
						/>
					</div>
				</div>
			{/each}
			<Button type="button" variant="outline" onclick={addAttributeEntry}>Add attribute</Button>
		{/if}
	</div>
</div>
