<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';

	type CreateAttributeEntry = { attributeId: string; attributeTitle: string; value: string };

	let {
		createCategoryId = $bindable(''),
		categoryError = null as string | null,
		categoriesList = [] as { id: string; value: string; handle?: string }[],
		createAttributeEntries = [] as CreateAttributeEntry[],
		attributesList = [] as {
			id: string;
			title?: string;
			value?: string;
			name?: string;
			type: string;
			options?: string[];
		}[],
		attributesLoading = false,
		attributesLoadError = null as string | null,
		setAttributeEntryValue
	}: {
		createCategoryId: string;
		categoryError: string | null;
		categoriesList: { id: string; value: string; handle?: string }[];
		createAttributeEntries: CreateAttributeEntry[];
		attributesList: {
			id: string;
			title?: string;
			value?: string;
			name?: string;
			type: string;
			options?: string[];
		}[];
		attributesLoading: boolean;
		attributesLoadError: string | null;
		setAttributeEntryValue: (attributeId: string, value: string) => void;
	} = $props();

	function getLabel(item: { title?: string; value?: string; name?: string }): string {
		return item.title ?? item.value ?? item.name ?? '';
	}

	function getEntryValue(attributeId: string): string {
		return createAttributeEntries.find((entry) => entry.attributeId === attributeId)?.value ?? '';
	}

	function getInputType(type: string): 'text' | 'number' {
		const normalized = type.trim().toLowerCase();
		if (
			normalized.includes('number') ||
			normalized.includes('int') ||
			normalized.includes('float') ||
			normalized.includes('decimal')
		) {
			return 'number';
		}
		return 'text';
	}

	function isSelectType(type: string): boolean {
		const normalized = type.trim().toLowerCase();
		return normalized.includes('select') || normalized.includes('enum');
	}

	function getPlaceholder(label: string): string {
		return `Enter ${label.toLowerCase()}`;
	}

	const selectedCategoryName = $derived(
		categoriesList.find((category) => category.id === createCategoryId)?.value ?? ''
	);
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
			{#if attributesLoading}
				<p class="text-sm text-muted-foreground">Loading attributes...</p>
			{:else if attributesLoadError}
				<p class="text-sm text-destructive">{attributesLoadError}</p>
			{:else if attributesList.length === 0}
				<p class="text-sm text-muted-foreground">No attributes linked to this category.</p>
			{:else}
				<div class="space-y-1">
					<p class="text-sm font-semibold">
						Category: {selectedCategoryName || 'Selected category'}
					</p>
					<p class="text-xs text-muted-foreground">
						Set values for each attribute linked to this category.
					</p>
				</div>
				<div class="rounded-lg border bg-card">
					{#each attributesList as attribute, i (attribute.id)}
						<div
							class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4{i <
							attributesList.length - 1
								? ' border-b'
								: ''}"
						>
							<label
								class="w-full shrink-0 text-sm font-medium text-foreground capitalize sm:w-40"
								for="create-attr-value-{attribute.id}"
							>
								{getLabel(attribute)}
							</label>
							{#if isSelectType(attribute.type ?? '') && (attribute.options?.length ?? 0) > 0}
								<select
									id="create-attr-value-{attribute.id}"
									class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm sm:flex-1"
									value={getEntryValue(attribute.id)}
									onchange={(e) => setAttributeEntryValue(attribute.id, e.currentTarget.value)}
								>
									<option value="">Select {getLabel(attribute).toLowerCase()}</option>
									{#each attribute.options ?? [] as optionValue (optionValue)}
										<option value={optionValue}>{optionValue}</option>
									{/each}
								</select>
							{:else}
								<Input
									id="create-attr-value-{attribute.id}"
									class="h-9 flex-1 bg-background"
									type={getInputType(attribute.type ?? '')}
									placeholder={getPlaceholder(getLabel(attribute))}
									value={getEntryValue(attribute.id)}
									oninput={(e) => setAttributeEntryValue(attribute.id, e.currentTarget.value)}
								/>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
