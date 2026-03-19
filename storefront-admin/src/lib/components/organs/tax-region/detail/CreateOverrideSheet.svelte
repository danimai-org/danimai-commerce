<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Search from '@lucide/svelte/icons/search';

	interface Props {
		open: boolean;
		regionId?: string;
		onSave?: (data: OverrideFormData) => void;
	}

	type TargetType = 'products' | 'product_types' | 'product_collections' | 'product_tags';

	type Target = {
		type: TargetType;
		search: string;
	};

	export type OverrideFormData = {
		name: string;
		rate: string;
		code: string;
		is_combinable: boolean;
		targets: Target[];
	};

	const targetTypeLabels: Record<TargetType, string> = {
		products: 'Products',
		product_types: 'Product Types',
		product_collections: 'Product Collections',
		product_tags: 'Product Tags'
	};

	let { open = $bindable(false), regionId: _regionId, onSave }: Props = $props();

	let name = $state('');
	let rate = $state('0.00');
	let code = $state('');
	let isCombable = $state(false);
	let targets = $state<Target[]>([]);

	function resetForm() {
		name = '';
		rate = '0.00';
		code = '';
		isCombable = false;
		targets = [];
	}

	function addTarget() {
		targets = [...targets, { type: 'products', search: '' }];
	}

	function removeTarget(index: number) {
		targets = targets.filter((_, i) => i !== index);
	}

	function handleSave() {
		onSave?.({
			name,
			rate,
			code,
			is_combinable: isCombable,
			targets
		});
		resetForm();
		open = false;
	}

	function handleCancel() {
		resetForm();
		open = false;
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Override</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Create a tax rate that overrides the default tax rates for selected conditions.
				</p>

				<div class="mt-6 flex flex-col gap-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-2">
							<label for="override-name" class="text-sm font-medium">Name</label>
							<Input id="override-name" bind:value={name} class="h-9" />
						</div>
						<div class="flex flex-col gap-2">
							<label for="override-rate" class="text-sm font-medium">Tax rate</label>
							<div class="flex items-center gap-0">
								<span
									class="flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground"
								>
									%
								</span>
								<Input
									id="override-rate"
									bind:value={rate}
									class="h-9 rounded-l-none"
									type="number"
									step="0.01"
									min="0"
								/>
							</div>
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<label for="override-code" class="text-sm font-medium">Tax code</label>
						<Input id="override-code" bind:value={code} class="h-9" />
					</div>

					<div class="mt-2 rounded-lg border bg-muted/30 px-4 py-3">
						<div class="flex items-start gap-3">
						<button
							type="button"
							role="switch"
							aria-checked={isCombable}
							aria-label="Toggle combinable"
							class="relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 {isCombable
								? 'bg-primary'
								: 'bg-input'}"
							onclick={() => (isCombable = !isCombable)}
						>
								<span
									class="pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out {isCombable
										? 'translate-x-4'
										: 'translate-x-0'}"
								></span>
							</button>
							<div class="flex flex-col">
								<span class="text-sm font-medium">Combinable</span>
								<span class="text-sm text-muted-foreground">
									Whether this tax rate can be combined with the default rate from the tax region.
								</span>
							</div>
						</div>
					</div>
				</div>

				<div class="mt-6">
					<div class="flex items-baseline justify-between">
						<div>
							<span class="text-sm font-medium">Targets</span>
							<span class="ml-1 text-sm text-muted-foreground">(Optional)</span>
							<p class="mt-0.5 text-sm text-muted-foreground">
								Select the targets that this tax rate will apply to.
							</p>
						</div>
						<button
							type="button"
							class="text-sm font-medium text-primary hover:underline"
							onclick={addTarget}
						>
							Add target
						</button>
					</div>

					{#each targets as target, i}
						<div class="mt-3 rounded-lg border p-3">
							<div class="flex items-center gap-2">
								<Select.Root
									type="single"
									value={target.type}
									onValueChange={(v) => {
										if (v) targets[i].type = v as TargetType;
									}}
								>
									<Select.Trigger class="w-44">
										<span class="flex items-center justify-between gap-2">
											<span>{targetTypeLabels[target.type]}</span>
											<ChevronDown class="size-4 opacity-50" />
										</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="products" label="Products">Products</Select.Item>
										<Select.Item value="product_types" label="Product Types"
											>Product Types</Select.Item
										>
										<Select.Item value="product_collections" label="Product Collections"
											>Product Collections</Select.Item
										>
										<Select.Item value="product_tags" label="Product Tags"
											>Product Tags</Select.Item
										>
									</Select.Content>
								</Select.Root>
								<span class="text-sm text-muted-foreground">in</span>
							</div>
							<div class="mt-2 flex items-center gap-2">
								<div class="relative flex-1">
									<Search
										class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
									/>
									<Input
										bind:value={targets[i].search}
										placeholder="Search for {targetTypeLabels[target.type].toLowerCase()}"
										class="h-9 pl-9"
									/>
								</div>
								<Button size="sm" variant="outline">Browse</Button>
								<Button size="sm" variant="outline" onclick={() => removeTarget(i)}>Delete</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={handleCancel}>Cancel</Button>
				<Button onclick={handleSave}>Save</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
