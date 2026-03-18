<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Combobox, type ComboboxOption } from '$lib/components/organs/index.js';
	import X from '@lucide/svelte/icons/x';

	type CreateAttributeEntry = { attributeId: string; attributeTitle: string; value: string };

	let {
		createAttributeGroupId = $bindable(''),
		attributeGroupError = null as string | null,
		attributeGroupsList = [] as { id: string; title?: string; value?: string; name?: string }[],
		createAttributeEntries = [] as CreateAttributeEntry[],
		attributesList = [] as {
			id: string;
			title?: string;
			value?: string;
			name?: string;
			type: string;
			attribute_group_id?: string | null;
			product_attribute_group_id?: string | null;
			attributeGroupId?: string | null;
			attribute_group?: { id?: string | null } | null;
			product_attribute_group?: { id?: string | null } | null;
			group_id?: string | null;
		}[],
		addAttributeEntry,
		removeAttributeEntry,
		setAttributeEntryAttribute,
		setAttributeEntryValue
	}: {
		createAttributeGroupId: string;
		attributeGroupError: string | null;
		attributeGroupsList: { id: string; title?: string; value?: string; name?: string }[];
		createAttributeEntries: CreateAttributeEntry[];
		attributesList: {
			id: string;
			title?: string;
			value?: string;
			name?: string;
			type: string;
			attribute_group_id?: string | null;
			product_attribute_group_id?: string | null;
			attributeGroupId?: string | null;
			attribute_group?: { id?: string | null } | null;
			product_attribute_group?: { id?: string | null } | null;
			group_id?: string | null;
		}[];
		addAttributeEntry: () => void;
		removeAttributeEntry: (index: number) => void;
		setAttributeEntryAttribute: (index: number, attributeId: string) => void;
		setAttributeEntryValue: (entryIndex: number, value: string) => void;
	} = $props();

	function getLabel(item: { title?: string; value?: string; name?: string }): string {
		return item.title ?? item.value ?? item.name ?? '';
	}

	function getAttributeGroupId(item: {
		attribute_group_id?: string | null;
		product_attribute_group_id?: string | null;
		attributeGroupId?: string | null;
		attribute_group?: { id?: string | null } | null;
		product_attribute_group?: { id?: string | null } | null;
		group_id?: string | null;
	}): string | null {
		return (
			item.attribute_group_id ??
			item.product_attribute_group_id ??
			item.attributeGroupId ??
			item.attribute_group?.id ??
			item.product_attribute_group?.id ??
			item.group_id ??
			null
		);
	}

	const attributeGroupOptions = $derived.by<ComboboxOption[]>(() =>
		attributeGroupsList
			.map((ag) => ({ id: ag.id, value: getLabel(ag) }))
			.filter((ag) => ag.value.trim())
	);

	function getAttributeOptions(entryIndex: number): ComboboxOption[] {
		return attributesList
			.filter(
				(a) =>
					(!createAttributeGroupId || getAttributeGroupId(a) === createAttributeGroupId) &&
					!createAttributeEntries.some((e2, i2) => i2 !== entryIndex && e2.attributeId === a.id)
			)
			.map((attr) => ({ id: attr.id, value: getLabel(attr) }))
			.filter((attr) => attr.value.trim());
	}
</script>

<div class="flex-1 overflow-auto p-4 pt-4 sm:p-6 sm:pt-4">
	<h2 class="text-lg font-semibold">Attributes</h2>
	<p class="mt-1 text-sm text-muted-foreground">
		Assign product attributes and their values. You can manage attributes from the product detail
		page after creation.
	</p>
	<div class="mt-6 flex flex-col gap-4">
		<div class="flex flex-col gap-2">
			<label for="create-attr-group-select" class="text-sm font-medium">Attribute group</label>
			<Combobox
				id="create-attr-group-select"
				bind:value={createAttributeGroupId}
				options={attributeGroupOptions}
				placeholder="Select attribute group"
				emptyMessage="No attribute groups found"
				triggerClass="w-full"
			/>
			<p class="text-xs text-muted-foreground">
				Required when adding attributes. Attributes must belong to the selected group.
			</p>
			{#if attributeGroupError}
				<p class="text-xs text-destructive">{attributeGroupError}</p>
			{/if}
		</div>
		{#each createAttributeEntries as entry, entryIndex (entryIndex)}
			<div class="rounded-lg border p-4">
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0 flex-1 space-y-3">
						<div class="flex flex-col gap-2">
							<label for="create-attr-select-{entryIndex}" class="text-sm font-medium"
								>Attribute</label
							>
							<Combobox
								id={`create-attr-select-${entryIndex}`}
								options={getAttributeOptions(entryIndex)}
								placeholder="Select attribute"
								emptyMessage="No attributes found"
								bind:value={
									() => entry.attributeId, (v) => setAttributeEntryAttribute(entryIndex, v)
								}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-attr-value-{entryIndex}" class="text-sm font-medium">Value</label>
							<Input
								id="create-attr-value-{entryIndex}"
								class="h-9"
								placeholder="Value"
								value={entry.value}
								oninput={(e) =>
									setAttributeEntryValue(entryIndex, (e.currentTarget as HTMLInputElement).value)}
							/>
						</div>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						class="size-8 shrink-0 text-destructive hover:bg-destructive/10"
						onclick={() => removeAttributeEntry(entryIndex)}
						aria-label="Remove attribute"
					>
						<X class="size-4" />
					</Button>
				</div>
			</div>
		{/each}
		<Button type="button" variant="outline" class="w-fit" onclick={addAttributeEntry}
			>Add attribute</Button
		>
	</div>
</div>
