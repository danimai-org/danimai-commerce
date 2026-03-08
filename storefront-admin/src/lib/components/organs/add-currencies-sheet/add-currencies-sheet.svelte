<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Search from '@lucide/svelte/icons/search';
	import { createQuery } from '@tanstack/svelte-query';
	import { cn } from '$lib/utils.js';
	import { listAvailableCurrencies, createCurrencies } from '$lib/currencies/api.js';
	import type { AvailableCurrency, AvailableCurrenciesResponse } from '$lib/currencies/types.js';

	let {
		open = $bindable(false),
		onSuccess = () => {}
	}: {
		open?: boolean;
		onSuccess?: () => void;
	} = $props();

	let search = $state('');
	let page = $state(1);
	let limit = $state(10);
	let addSelected = $state<Map<string, boolean>>(new Map());
	let addSubmitting = $state(false);
	let addError = $state<string | null>(null);

	const availableQuery = createQuery(() => ({
		queryKey: ['add-currencies', page, limit, search] as const,
		queryFn: () => listAvailableCurrencies({ page, limit, search }),
		enabled: open
	}));

	const availableQueryData = $derived(availableQuery.data as AvailableCurrenciesResponse | undefined);
	const availableList = $derived(availableQueryData?.data ?? []);
	const availablePagination = $derived(availableQueryData?.pagination ?? null);
	const availableLoading = $derived(availableQuery.isPending);
	const availableStart = $derived(
		availablePagination ? (availablePagination.page - 1) * availablePagination.limit + 1 : 0
	);
	const availableEnd = $derived(
		availablePagination
			? Math.min(availablePagination.page * availablePagination.limit, availablePagination.total)
			: 0
	);

	const toAdd = $derived(availableList.filter((c) => !c.active && addSelected.has(c.code)));

	$effect(() => {
		if (open) {
			page = 1;
			limit = 10;
			search = '';
			addSelected = new Map();
			addError = null;
		}
	});

	function closeSheet() {
		if (!addSubmitting) {
			open = false;
			addError = null;
			addSelected = new Map();
		}
	}

	function goToAvailablePage(pageNum: number) {
		page = Math.max(1, pageNum);
	}

	function toggleAddSelect(item: AvailableCurrency) {
		if (item.active) return;
		addSelected = new Map(addSelected);
		if (addSelected.has(item.code)) addSelected.delete(item.code);
		else addSelected.set(item.code, item.tax_inclusive_pricing);
	}

	function setAddTaxInclusive(code: string, value: boolean) {
		addSelected = new Map(addSelected);
		addSelected.set(code, value);
	}

	function toggleAddSelectAll() {
		const notActive = availableList.filter((c) => !c.active);
		const allSelected = notActive.every((c) => addSelected.has(c.code));
		addSelected = new Map(addSelected);
		if (allSelected) {
			notActive.forEach((c) => addSelected.delete(c.code));
		} else {
			notActive.forEach((c) => addSelected.set(c.code, c.tax_inclusive_pricing));
		}
	}

	async function submitAdd() {
		const payload = toAdd.map((c) => ({
			code: c.code,
			tax_inclusive_pricing: addSelected.get(c.code) ?? false
		}));
		if (payload.length === 0) {
			closeSheet();
			return;
		}
		addSubmitting = true;
		addError = null;
		try {
			await createCurrencies({ currencies: payload });
			open = false;
			addSelected = new Map();
			onSuccess();
		} catch (e) {
			addError = e instanceof Error ? e.message : String(e);
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
				<p class="mt-1 text-sm text-muted-foreground">
					Select from the fixed list of 123 currencies. Only selected currencies will be added as
					active.
				</p>
				<div class="mt-4 flex items-center gap-2">
					<div class="relative flex-1">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search by currency code"
							bind:value={search}
							oninput={() => (page = 1)}
							class="h-9 rounded-md pl-9"
						/>
					</div>
				</div>
			</div>
			{#if addError && !addSubmitting}
				<div
					class="mx-4 mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{addError}
				</div>
			{/if}
			<div class="min-h-0 flex-1 overflow-auto p-4">
				{#if availableLoading}
					<p class="text-muted-foreground">Loading…</p>
				{:else}
					<table class="w-full text-sm">
						<thead class="border-b bg-muted/50">
							<tr>
								<th class="w-10 px-4 py-3">
									<input
										type="checkbox"
										class="h-4 w-4 rounded border-input"
										checked={availableList.filter((c) => !c.active).length > 0 &&
											availableList.every((c) => c.active || addSelected.has(c.code))}
										onchange={toggleAddSelectAll}
									/>
								</th>
								<th class="px-4 py-3 text-left font-medium">Code</th>
								<th class="px-4 py-3 text-left font-medium">Name</th>
								<th class="px-4 py-3 text-left font-medium">Tax inclusive pricing</th>
							</tr>
						</thead>
						<tbody>
							{#each availableList as item (item.code)}
								<tr
									class={cn(
										'border-b transition-colors hover:bg-muted/30',
										item.active && 'opacity-60'
									)}
								>
									<td class="px-4 py-3">
										<input
											type="checkbox"
											class="h-4 w-4 rounded border-input"
											disabled={item.active}
											checked={addSelected.has(item.code)}
											onchange={() => toggleAddSelect(item)}
										/>
									</td>
									<td class="px-4 py-3 font-medium">{item.code}</td>
									<td class="px-4 py-3 text-muted-foreground">{item.name}</td>
									<td class="px-4 py-3">
										<input
											type="checkbox"
											class="h-4 w-4 rounded border-input"
											disabled={item.active}
											checked={addSelected.get(item.code) ?? item.tax_inclusive_pricing}
											onchange={(e) =>
												setAddTaxInclusive(
													item.code,
													(e.currentTarget as HTMLInputElement).checked
												)}
										/>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
				{#if availablePagination && availablePagination.total > 0}
					<div class="mt-4 flex items-center justify-between border-t pt-4">
						<p class="text-sm text-muted-foreground">
							{availableStart} – {availableEnd} of {availablePagination.total} results
						</p>
						<div class="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={!availablePagination.has_previous_page}
								onclick={() => goToAvailablePage(availablePagination.page - 1)}
							>
								Prev
							</Button>
							<span class="text-sm text-muted-foreground">
								{availablePagination.page} of {availablePagination.total_pages} pages
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={!availablePagination.has_next_page}
								onclick={() => goToAvailablePage(availablePagination.page + 1)}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeSheet}>Cancel</Button>
				<Button onclick={submitAdd} disabled={addSubmitting || toAdd.length === 0}>
					{addSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
