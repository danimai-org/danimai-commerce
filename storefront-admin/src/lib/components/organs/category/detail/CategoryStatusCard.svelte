<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { client } from '$lib/client.js';
	import { cn } from '$lib/utils.js';

	import type { CategoryDetail } from '../type.js';

	type CategoryResource = ReturnType<(typeof client)['product-categories']>;
	type ProductCategoryPutBody = NonNullable<Parameters<CategoryResource['put']>[0]>;
	type ProductCategoryPutStatus = NonNullable<ProductCategoryPutBody['status']>;

	interface Props {
		category: CategoryDetail | null;
		onUpdated?: () => void | Promise<void>;
	}

	let { category, onUpdated = () => {} }: Props = $props();

	let statusUpdating = $state(false);

	function statusLabel(s: string | undefined): string {
		if (!s) return 'Inactive';
		if (s === 'active') return 'Active';
		return 'Inactive';
	}

	async function updateStatus(newStatus: 'active' | 'inactive') {
		if (!category) return;
		statusUpdating = true;
		try {
			const res = await client['product-categories']({ id: category.id }).put({
				status: newStatus as ProductCategoryPutStatus
			});
			if (!res.error) {
				await onUpdated();
			}
		} catch (e) {
			console.error('Failed to update status:', e);
		} finally {
			statusUpdating = false;
		}
	}
</script>

<div class="flex w-full flex-col rounded-lg border bg-card p-6 shadow-sm lg:w-72 lg:shrink-0 lg:self-stretch">
	<h2 class="mb-4 font-semibold">Status</h2>
	<Select.Root
		type="single"
		value={category?.status ?? 'inactive'}
		onValueChange={(v) => {
			if (v && (v === 'active' || v === 'inactive')) {
				updateStatus(v);
			}
		}}
		disabled={statusUpdating || !category}
	>
		<Select.Trigger class="w-full">
			<span
				class={cn(
					'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
					category?.status === 'active' && 'bg-green-500/10 text-green-700 dark:text-green-400',
					category?.status === 'inactive' && 'bg-red-500/10 text-red-700 dark:text-red-400'
				)}
			>
				<span
					class={cn(
						'size-1.5 shrink-0 rounded-sm bg-current opacity-70',
						category?.status === 'active' && 'bg-green-600',
						category?.status === 'inactive' && 'bg-red-600'
					)}
				></span>
				{statusLabel(category?.status)}
			</span>
		</Select.Trigger>
		<Select.Content class="min-w-[var(--bits-select-anchor-width)]">
			<Select.Item value="active" label="Active">Active</Select.Item>
			<Select.Item value="inactive" label="Inactive">Inactive</Select.Item>
		</Select.Content>
	</Select.Root>
</div>
