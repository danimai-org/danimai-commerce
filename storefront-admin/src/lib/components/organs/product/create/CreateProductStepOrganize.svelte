<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';

	let {
		createDiscountable = $bindable(true),
		createCollectionId = $bindable(''),
		createCategoryId = $bindable(''),
		createTagIds = [] as string[],
		categoryError = null as string | null,
		createSalesChannels = [] as { id: string; name: string }[],
		createSalesChannelInput = $bindable(''),
		collectionsList = [] as { id: string; title: string; handle: string }[],
		categoriesList = [] as { id: string; value: string; handle: string }[],
		tagsList = [] as { id: string; value: string }[],
		salesChannelsList = [] as { id: string; name: string }[],
		addTag,
		removeTag,
		addSalesChannel,
		removeSalesChannel
	}: {
		createDiscountable: boolean;
		createCollectionId: string;
		createCategoryId: string;
		createTagIds: string[];
		categoryError: string | null;
		createSalesChannels: { id: string; name: string }[];
		createSalesChannelInput: string;
		collectionsList: { id: string; title: string; handle: string }[];
		categoriesList: { id: string; value: string; handle: string }[];
		tagsList: { id: string; value: string }[];
		salesChannelsList: { id: string; name: string }[];
		addTag: (tagId: string) => void;
		removeTag: (tagId: string) => void;
		addSalesChannel: () => void;
		removeSalesChannel: (id: string) => void;
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
			<select
				id="create-collection"
				bind:value={createCollectionId}
				class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<option value="">None</option>
				{#each collectionsList as col (col.id)}
					<option value={col.id}>{col.title}</option>
				{/each}
			</select>
		</div>
		<div class="flex flex-col gap-2">
			<label for="create-category" class="text-sm font-medium">
				Categories <span class="font-normal text-muted-foreground">(Optional)</span>
			</label>
			<select
				id="create-category"
				bind:value={createCategoryId}
				class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<option value="">None</option>
				{#each categoriesList as cat (cat.id)}
					<option value={cat.id}>{cat.value}</option>
				{/each}
			</select>
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
			<div class="flex flex-wrap items-center gap-2">
				{#each createTagIds as tagId (tagId)}
					{@const tag = tagsList.find((t) => t.id === tagId)}
					{#if tag}
						<span class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-sm">
							{tag.value}
							<button
								type="button"
								class="rounded p-0.5 hover:bg-muted"
								onclick={() => removeTag(tagId)}
								aria-label="Remove tag"
							>
								<X class="size-3.5" />
							</button>
						</span>
					{/if}
				{/each}
				<select
					id="create-tags-select"
					class="flex h-8 min-w-[120px] rounded-md border border-input bg-background px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
					onchange={(e) => {
						const el = e.currentTarget;
						const id = el.value;
						if (id) {
							addTag(id);
							el.value = '';
						}
					}}
				>
					<option value="">Add tag</option>
					{#each tagsList.filter((t) => !createTagIds.includes(t.id)) as tag (tag.id)}
						<option value={tag.id}>{tag.value}</option>
					{/each}
				</select>
			</div>
			{#if createTagIds.length > 0}
				<p class="text-xs text-muted-foreground">{createTagIds.length} selected</p>
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<label for="create-sales-channel-input" class="text-sm font-medium">
				Sales channels <span class="font-normal text-muted-foreground">(Optional)</span>
			</label>
			<p class="text-xs text-muted-foreground">
				This product will only be available in the default sales channel if left untouched.
			</p>
			<div class="flex flex-wrap items-center gap-2">
				{#each createSalesChannels as ch (ch.id)}
					<span class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-sm">
						{ch.name}
						<button
							type="button"
							class="rounded p-0.5 hover:bg-muted"
							onclick={() => removeSalesChannel(ch.id)}
							aria-label="Remove"
						>
							<X class="size-3.5" />
						</button>
					</span>
				{/each}
				<div class="flex gap-1">
					<select
						id="create-sales-channel-input"
						class="h-8 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm sm:w-48"
						bind:value={createSalesChannelInput}
						onchange={() => {
							if (createSalesChannelInput) {
								addSalesChannel();
								createSalesChannelInput = '';
							}
						}}
					>
						<option value="">Add sales channel</option>
						{#each salesChannelsList.filter((ch) => !createSalesChannels.some((s) => s.id === ch.id)) as channel (channel.id)}
							<option value={channel.id}>{channel.name}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</div>
</div>
