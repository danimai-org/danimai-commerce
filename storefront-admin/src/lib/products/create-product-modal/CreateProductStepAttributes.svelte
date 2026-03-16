<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import X from '@lucide/svelte/icons/x';

	type CreateAttributeEntry = { attributeId: string; attributeTitle: string; value: string };

	let {
		createAttributeGroupId = $bindable(''),
		attributeGroupsList = [] as { id: string; title: string }[],
		createAttributeEntries = [] as CreateAttributeEntry[],
		attributesList = [] as { id: string; title: string; type: string }[],
		addAttributeEntry,
		removeAttributeEntry,
		setAttributeEntryAttribute,
		setAttributeEntryValue
	}: {
		createAttributeGroupId: string;
		attributeGroupsList: { id: string; title: string }[];
		createAttributeEntries: CreateAttributeEntry[];
		attributesList: { id: string; title: string; type: string }[];
		addAttributeEntry: () => void;
		removeAttributeEntry: (index: number) => void;
		setAttributeEntryAttribute: (index: number, attributeId: string) => void;
		setAttributeEntryValue: (entryIndex: number, value: string) => void;
	} = $props();
</script>

<div class="flex-1 overflow-auto p-6 pt-4">
	<h2 class="text-lg font-semibold">Attributes</h2>
	<p class="mt-1 text-sm text-muted-foreground">
		Assign product attributes and their values. You can manage attributes from the product detail page after
		creation.
	</p>
	<div class="mt-6 flex flex-col gap-4">
		<div class="flex flex-col gap-2">
			<label for="create-attr-group-select" class="text-sm font-medium">Attribute group</label>
			<Select.Root
				type="single"
				value={createAttributeGroupId}
				onValueChange={(v) => (createAttributeGroupId = v ?? '')}
				allowDeselect
			>
				<Select.Trigger id="create-attr-group-select" class="w-full max-w-xs">
					{attributeGroupsList.find((g) => g.id === createAttributeGroupId)?.title ?? 'Select attribute group'}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>Attribute group</Select.Label>
						<Select.Item value="" label="Select attribute group">Select attribute group</Select.Item>
						{#each attributeGroupsList as ag (ag.id)}
							<Select.Item value={ag.id} label={ag.title}>{ag.title}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
			<p class="text-xs text-muted-foreground">
				Required when adding attributes. Attributes must belong to the selected group.
			</p>
		</div>
		{#each createAttributeEntries as entry, entryIndex (entryIndex)}
			<div class="rounded-lg border p-4">
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0 flex-1 space-y-3">
						<div class="flex flex-col gap-2">
							<label for="create-attr-select-{entryIndex}" class="text-sm font-medium">Attribute</label>
							<Select.Root
								type="single"
								value={entry.attributeId}
								onValueChange={(v) => setAttributeEntryAttribute(entryIndex, v ?? '')}
								allowDeselect
							>
								<Select.Trigger id="create-attr-select-{entryIndex}" class="w-full">
									{entry.attributeTitle || 'Select attribute'}
								</Select.Trigger>
								<Select.Content>
									<Select.Group>
										<Select.Label>Attribute</Select.Label>
										<Select.Item value="" label="Select attribute">Select attribute</Select.Item>
										{#each attributesList.filter((a) => !createAttributeEntries.some((e2, i2) => i2 !== entryIndex && e2.attributeId === a.id)) as attr (attr.id)}
											<Select.Item value={attr.id} label={attr.title}>{attr.title}</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						</div>
						<div class="flex flex-col gap-2">
							<label for="create-attr-value-{entryIndex}" class="text-sm font-medium">Value</label>
							<Input
								id="create-attr-value-{entryIndex}"
								class="h-9"
								placeholder="Value"
								value={entry.value}
								oninput={(e) => setAttributeEntryValue(entryIndex, (e.currentTarget as HTMLInputElement).value)}
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
		<Button type="button" variant="outline" class="w-fit" onclick={addAttributeEntry}>Add attribute</Button>
	</div>
</div>
