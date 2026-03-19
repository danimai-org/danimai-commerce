<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';

	import { Combobox } from '$lib/components/organs/index.js';
	import { MultiSelectCombobox } from '$lib/components/organs/index.js';

	let {
		createDiscountable = $bindable(true),
		createCollectionIds = $bindable([]),
		createCategoryId = $bindable(''),
		createTagIds = $bindable([] as string[]),
		categoryError = null as string | null,
		createSalesChannels = [] as { id: string; name: string }[],
		createSalesChannelIds = $bindable([]),
		collectionsList = $bindable([]),
		categoriesList = $bindable([]),
		tagsList = $bindable([]),
		salesChannelsList = $bindable([]),
		addTag = $bindable((tagIds: string[]) => {}),
		removeTag = $bindable((tagId: string) => {}),
		addSalesChannel = $bindable((ids: string[]) => {}),
		removeSalesChannel = $bindable((id: string) => {}),
	} = $props();
</script>

<div class="flex-1 overflow-auto p-4 pt-4 sm:p-6 sm:pt-4">
	<h2 class="text-lg font-semibold">Organize</h2>
	<p class="mt-1 text-sm text-muted-foreground">
		Organize your product with collections, categories, and channels.
	</p>
	<div class="mt-6 flex flex-col gap-6">
		<div class="flex flex-col gap-2">
			<label for="create-discountable" class="text-sm font-medium">
				Discountable <span class="font-normal text-muted-foreground">(Optional)</span>
			</label>
			<div class="flex items-center gap-2">
				<button
					id="create-discountable"
					type="button"
					role="switch"
					aria-checked={createDiscountable}
					aria-label="Product is discountable"
					class={cn(
						'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
						createDiscountable ? 'bg-primary' : 'bg-input'
					)}
					onclick={() => (createDiscountable = !createDiscountable)}
				>
					<span
						class={cn(
							'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
							createDiscountable ? 'translate-x-5' : 'translate-x-px'
						)}
					></span>
				</button>
				<span class="text-sm">Apply discounts to this product</span>
			</div>
			<p class="text-xs text-muted-foreground">
				When unchecked, discounts will not be applied to this product.
			</p>
		</div>
		<div class="flex flex-col gap-2">
			<label for="create-collection" class="text-sm font-medium">
				Collection <span class="font-normal text-muted-foreground">(Optional)</span>
			</label>
			<MultiSelectCombobox
				id="create-collection"
				triggerClass="h-10 min-w-[10px] rounded-md border border-input bg-background px-3 py-1 text-sm"
				bind:value={createCollectionIds}
				options={collectionsList
					.filter((col) => !createCollectionIds.includes(col.id))
					.map((col) => ({ id: col.id, value: col.title }))}
				placeholder="Select collection"
				emptyMessage="No collections found"
			/>
			{#if createCollectionIds.length > 0}
				<div class="flex flex-wrap items-center gap-2">
					{#each createCollectionIds as collectionId (collectionId)}
						{@const collection = collectionsList.find((col) => col.id === collectionId)}
						{#if collection}
							<span class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-sm">
								{collection.title}
								<button
									type="button"
									class="rounded p-0.5 hover:bg-muted"
									onclick={() =>
										(createCollectionIds = createCollectionIds.filter((id) => id !== collectionId))}
									aria-label={`Remove ${collection.title} collection`}
								>
									<X class="size-3.5" />
								</button>
							</span>
						{/if}
					{/each}
				</div>
				<p class="text-xs text-muted-foreground">{createCollectionIds.length} selected</p>
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<label for="create-category" class="text-sm font-medium">
				Category <span class="font-normal text-muted-foreground">(Optional)</span>
			</label>
			<Combobox
				triggerClass="h-10 min-w-[10px] rounded-md border border-input bg-background px-3 py-1 text-sm"
				id="create-category"
				bind:value={createCategoryId}
				options={categoriesList.map((cat) => ({ id: cat.id, value: cat.value }))}
				placeholder="Select category"
				emptyMessage="No categories found"
			/>
			{#if createCategoryId}
				<p class="text-xs text-muted-foreground">1 selected</p>
			{/if}
			{#if categoryError}
				<p class="text-xs text-destructive">{categoryError}</p>
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<label for="create-tags-select" class="text-sm font-medium">
				Tags <span class="font-normal text-muted-foreground">(Optional)</span>
			</label>
			<MultiSelectCombobox
				id="create-tags-select"
				triggerClass="h-10 min-w-[10px] rounded-md border border-input bg-background px-3 py-1 text-sm"
				bind:value={createTagIds}
				options={tagsList.filter((t) => !createTagIds.includes(t.id)).map((t) => ({ id: t.id, value: t.value }))}
			/>
			{#if createTagIds.length > 0}
				<div class="flex flex-wrap items-center gap-2">
					{#each createTagIds as tagId (tagId)}
						{@const tag = tagsList.find((t) => t.id === tagId)}
						{#if tag}
							<span class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-sm">
								{tag.value}
								<button
									type="button"
									class="rounded p-0.5 hover:bg-muted"
									onclick={() => (createTagIds = createTagIds.filter((id) => id !== tagId))}
									aria-label="Remove tag"
								>
									<X class="size-3.5" />
								</button>
							</span>
						{/if}
					{/each}
				</div>
				<p class="text-xs text-muted-foreground">{createTagIds.length} selected</p>
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<label for="create-sales-channel-select" class="text-sm font-medium">
				Sales channels <span class="font-normal text-muted-foreground">(Optional)</span>
			</label>
			<p class="text-xs text-muted-foreground">
				This product will only be available in the default sales channel if left untouched.
			</p>
			<MultiSelectCombobox
				id="create-sales-channel-select"
				triggerClass="h-10 min-w-[10px] rounded-md border border-input bg-background px-3 py-1 text-sm"
				bind:value={createSalesChannelIds}
				options={salesChannelsList.filter((ch) => !createSalesChannelIds.includes(ch.id)).map((ch) => ({ id: ch.id, value: ch.name }))}
			/>
			{#if createSalesChannelIds.length > 0}
				<div class="flex flex-wrap items-center gap-2">
					{#each createSalesChannelIds as salesChannelId (salesChannelId)}
						{@const salesChannel = salesChannelsList.find((ch) => ch.id === salesChannelId)}
						{#if salesChannel}
							<span class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-sm">
								{salesChannel.name}
								<button
									type="button"
									class="rounded p-0.5 hover:bg-muted"
									onclick={() =>
										(createSalesChannelIds = createSalesChannelIds.filter((id) => id !== salesChannelId))}
									aria-label={`Remove ${salesChannel.name} sales channel`}
								>
									<X class="size-3.5" />
								</button>
							</span>
						{/if}
					{/each}
				</div>
				<p class="text-xs text-muted-foreground">{createSalesChannelIds.length} selected</p>
			{/if}
		</div>
	</div>
</div>
