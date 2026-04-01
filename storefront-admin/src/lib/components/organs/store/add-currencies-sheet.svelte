<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Search from '@lucide/svelte/icons/search';
	import { createQuery } from '@tanstack/svelte-query';
	import { cn } from '$lib/utils.js';
	import { createCurrencies, listAvailableCurrencies } from '$lib/currencies/api.js';
	import { SvelteMap } from 'svelte/reactivity';

	let { open = $bindable(false), onSuccess = () => {} } = $props();

	let search = $state('');
	const AVAILABLE_FETCH_LIMIT = 500;
	let addSelected = new SvelteMap<string, boolean>();
	let addSubmitting = $state(false);

	const availableQuery = createQuery(() => ({
		queryKey: ['add-currencies', 'available', AVAILABLE_FETCH_LIMIT],
		queryFn: () => listAvailableCurrencies({ page: 1, limit: AVAILABLE_FETCH_LIMIT }),
		enabled: open
	}));

	const availableRaw = $derived(availableQuery.data?.data ?? []);
	const availableList = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q) return availableRaw;
		return availableRaw.filter(
			(c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
		);
	});

	// Logic Fix: Only items that are NOT already active can be selected
	const selectableList = $derived(availableList.filter((c) => !c.active));
	const isAllSelected = $derived(
		selectableList.length > 0 && selectableList.every((c) => addSelected.has(c.code))
	);

	const toAdd = $derived(selectableList.filter((c) => addSelected.has(c.code)));

	function toggleAddSelectAll() {
		if (isAllSelected) {
			selectableList.forEach((c) => addSelected.delete(c.code));
		} else {
			selectableList.forEach((c) => addSelected.set(c.code, c.tax_inclusive_pricing));
		}
	}

	async function submitAdd() {
		const payload = toAdd.map((c) => ({
			code: c.code,
			tax_inclusive_pricing: addSelected.get(c.code) ?? false
		}));
		if (payload.length === 0) return;

		addSubmitting = true;
		try {
			await createCurrencies({ currencies: payload });
			open = false;
			onSuccess();
		} catch (e: unknown) {
			console.error(e);
		} finally {
			addSubmitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<div class="border-b p-4">
				<h2 class="text-lg font-semibold">Add currencies</h2>
				<div class="relative mt-4">
					<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search by code or name"
						bind:value={search}
						class="pl-9"
					/>
				</div>
			</div>

			<div class="flex-1 overflow-auto p-4">
				<table class="w-full text-sm">
					<thead class="border-b bg-muted/50">
						<tr>
							<th class="w-10 px-4 py-3">
								<input
									type="checkbox"
									checked={isAllSelected}
									onchange={toggleAddSelectAll}
									class="cursor-pointer"
								/>
							</th>
							<th class="px-4 py-3 text-left">Code</th>
							<th class="px-4 py-3 text-left">Name</th>
							<th class="px-4 py-3 text-left">Tax inclusive</th>
						</tr>
					</thead>
					<tbody>
						{#each availableList as item (item.code)}
							<tr class={cn('border-b hover:bg-muted/30', item.active && 'opacity-50 grayscale')}>
								<td class="px-4 py-3">
									<input
										type="checkbox"
										disabled={item.active}
										checked={addSelected.has(item.code)}
										onchange={() =>
											addSelected.has(item.code)
												? addSelected.delete(item.code)
												: addSelected.set(item.code, item.tax_inclusive_pricing)}
										class="cursor-pointer"
									/>
								</td>
								<td class="px-4 py-3 font-medium">{item.code}</td>
								<td class="px-4 py-3">{item.name}</td>
								<td class="px-4 py-3">
									<input
										type="checkbox"
										disabled={item.active || !addSelected.has(item.code)}
										checked={addSelected.get(item.code) ?? item.tax_inclusive_pricing}
										onchange={(e) => addSelected.set(item.code, e.currentTarget.checked)}
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button onclick={submitAdd} disabled={addSubmitting || toAdd.length === 0}>
					{addSubmitting ? 'Saving…' : 'Save Currencies'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
