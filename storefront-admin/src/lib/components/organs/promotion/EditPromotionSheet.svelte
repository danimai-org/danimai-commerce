<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Info from '@lucide/svelte/icons/info';
	import { cn } from '$lib/utils.js';
	import type { Promotion } from './types.js';

	let {
		open = $bindable(false),
		promotion = null as Promotion | null,
		onSave
	}: {
		open?: boolean;
		promotion: Promotion | null;
		onSave?: (updated: Pick<Promotion, 'id' | 'code' | 'method' | 'status'>) => void;
	} = $props();

	let editCode = $state('');
	let editMethod = $state<'promotion_code' | 'automatic'>('promotion_code');
	let editStatus = $state<'draft' | 'active' | 'inactive'>('draft');
	let editValueType = $state<'fixed' | 'percentage'>('fixed');
	let editAmount = $state<number | ''>('');
	let editAllocation = $state<'each' | 'across' | 'once'>('each');
	let editMaxQuantity = $state<number | ''>(1);

	$effect(() => {
		if (promotion) {
			editCode = promotion.code;
			editMethod = promotion.method === 'Manual' ? 'promotion_code' : 'automatic';
			editStatus =
				promotion.status === 'Active' ? 'active' : promotion.status === 'Inactive' ? 'inactive' : 'draft';
			editValueType = 'fixed';
			editAmount = 334.0;
			editAllocation = 'each';
			editMaxQuantity = 1;
		}
	});

	function close() {
		open = false;
	}

	function save() {
		if (!promotion) return;
		onSave?.({
			id: promotion.id,
			code: editCode,
			method: editMethod === 'promotion_code' ? 'Manual' : 'Automatic',
			status:
				editStatus === 'active' ? 'Active' : editStatus === 'inactive' ? 'Inactive' : 'Draft'
		});
		close();
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1 border-b px-6 py-4">
				<h2 class="text-lg font-semibold text-center">Edit Promotion Details</h2>
			</Sheet.Header>
			<div class="flex-1 overflow-auto px-6 py-6">
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-2">
						<label for="edit-code" class="text-sm font-medium">Code</label>
						<Input id="edit-code" bind:value={editCode} placeholder="e.g. SUMMER15" class="h-9" />
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Method</span>
						<div class="flex flex-col gap-2">
							<label
								class={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
									editMethod === 'promotion_code' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="edit-method"
									value="promotion_code"
									checked={editMethod === 'promotion_code'}
									onchange={() => (editMethod = 'promotion_code')}
									class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
								/>
								<div>
									<span class="font-medium">Promotion code</span>
									<p class="mt-0.5 text-sm text-muted-foreground">Customers must enter this code at checkout</p>
								</div>
							</label>
							<label
								class={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
									editMethod === 'automatic' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="edit-method"
									value="automatic"
									checked={editMethod === 'automatic'}
									onchange={() => (editMethod = 'automatic')}
									class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
								/>
								<div>
									<span class="font-medium">Automatic</span>
									<p class="mt-0.5 text-sm text-muted-foreground">Customers will see this promotion at checkout</p>
								</div>
							</label>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Status</span>
						<div class="flex flex-col gap-2">
							<label
								class={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
									editStatus === 'draft' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="edit-status"
									value="draft"
									checked={editStatus === 'draft'}
									onchange={() => (editStatus = 'draft')}
									class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
								/>
								<div>
									<span class="font-medium">Draft</span>
									<p class="mt-0.5 text-sm text-muted-foreground">Customers will not be able to use the code yet</p>
								</div>
							</label>
							<label
								class={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
									editStatus === 'active' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="edit-status"
									value="active"
									checked={editStatus === 'active'}
									onchange={() => (editStatus = 'active')}
									class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
								/>
								<div>
									<span class="font-medium">Active</span>
									<p class="mt-0.5 text-sm text-muted-foreground">Customers will be able to use the code</p>
								</div>
							</label>
							<label
								class={cn(
									'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
									editStatus === 'inactive' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
								)}
							>
								<input
									type="radio"
									name="edit-status"
									value="inactive"
									checked={editStatus === 'inactive'}
									onchange={() => (editStatus = 'inactive')}
									class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
								/>
								<div>
									<span class="font-medium">Inactive</span>
									<p class="mt-0.5 text-sm text-muted-foreground">Promotion is disabled</p>
								</div>
							</label>
						</div>
					</div>

					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium">Value Type</span>
							<div class="flex flex-col gap-2">
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										editValueType === 'fixed' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="edit-value-type"
										value="fixed"
										checked={editValueType === 'fixed'}
										onchange={() => (editValueType = 'fixed')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">Fixed amount</span>
										<p class="mt-0.5 text-sm text-muted-foreground">The amount to be discounted. eg. 100</p>
									</div>
								</label>
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										editValueType === 'percentage' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="edit-value-type"
										value="percentage"
										checked={editValueType === 'percentage'}
										onchange={() => (editValueType = 'percentage')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">Percentage</span>
										<p class="mt-0.5 text-sm text-muted-foreground">The percentage to discount off the amount. eg. 8%</p>
									</div>
								</label>
							</div>
						</div>

						<div class="flex flex-col gap-2">
							<label for="edit-amount" class="text-sm font-medium">Amount</label>
							<div class="relative flex items-center">
								<span class="absolute left-3 text-sm text-muted-foreground">USD</span>
								<Input
									id="edit-amount"
									type="number"
									step="0.01"
									min="0"
									bind:value={editAmount}
									class="h-9 pl-14 pr-8"
									placeholder="0.00"
								/>
								<span class="absolute right-3 text-sm text-muted-foreground">$</span>
							</div>
						</div>

						<div class="flex flex-col gap-2">
							<div class="flex items-center gap-1.5">
								<span class="text-sm font-medium">Allocation</span>
								<Info class="size-4 text-muted-foreground" />
							</div>
							<div class="flex flex-col gap-2">
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										editAllocation === 'each' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="edit-allocation"
										value="each"
										checked={editAllocation === 'each'}
										onchange={() => (editAllocation = 'each')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">Each</span>
										<p class="mt-0.5 text-sm text-muted-foreground">Applies value on each item</p>
									</div>
								</label>
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										editAllocation === 'across' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="edit-allocation"
										value="across"
										checked={editAllocation === 'across'}
										onchange={() => (editAllocation = 'across')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">Across</span>
										<p class="mt-0.5 text-sm text-muted-foreground">Applies value across items</p>
									</div>
								</label>
								<label
									class={cn(
										'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
										editAllocation === 'once' ? 'border-primary bg-primary/5' : 'border-input hover:bg-muted/30'
									)}
								>
									<input
										type="radio"
										name="edit-allocation"
										value="once"
										checked={editAllocation === 'once'}
										onchange={() => (editAllocation = 'once')}
										class="mt-1 size-4 shrink-0 border-primary text-primary focus:ring-primary"
									/>
									<div>
										<span class="font-medium">Once</span>
										<p class="mt-0.5 text-sm text-muted-foreground">Applies value to a limited number of items</p>
									</div>
								</label>
							</div>
						</div>

						<div class="flex flex-col gap-2">
							<label for="edit-max-quantity" class="text-sm font-medium">Maximum Quantity</label>
							<Input id="edit-max-quantity" type="number" min="1" bind:value={editMaxQuantity} class="h-9" />
							<p class="text-sm text-muted-foreground">Maximum quantity of items this promotion applies to.</p>
						</div>
					</div>
				</div>
			</div>
			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close}>Cancel</Button>
				<Button onclick={save}>Save</Button>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>
