<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { Input } from '$lib/components/ui/input/index.js';
	import { DropdownMenu } from 'bits-ui';

	interface Props {
		regionId: string;
	}

	let { regionId }: Props = $props();

	const PLACEHOLDER_COUNTRIES = [
		{ name: 'India', code: 'IN' },
		{ name: 'United States', code: 'US' },
		{ name: 'United Kingdom', code: 'GB' },
		{ name: 'Germany', code: 'DE' },
		{ name: 'France', code: 'FR' },
		{ name: 'Canada', code: 'CA' },
		{ name: 'Australia', code: 'AU' },
		{ name: 'Japan', code: 'JP' },
		{ name: 'Spain', code: 'ES' },
		{ name: 'Italy', code: 'IT' },
		{ name: 'Brazil', code: 'BR' },
		{ name: 'Mexico', code: 'MX' },
		{ name: 'Netherlands', code: 'NL' },
		{ name: 'Singapore', code: 'SG' }
	];

	let searchQuery = $state('');

	const filteredCountries = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return PLACEHOLDER_COUNTRIES;
		return PLACEHOLDER_COUNTRIES.filter(
			(c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
		);
	});

	let selectedIds = $state<Set<string>>(new Set());

	const allSelected = $derived(
		filteredCountries.length > 0 && filteredCountries.every((c) => selectedIds.has(c.code))
	);

	function toggleAll() {
		if (allSelected) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(filteredCountries.map((c) => c.code));
		}
	}

	function toggleOne(code: string) {
		const next = new Set(selectedIds);
		if (next.has(code)) {
			next.delete(code);
		} else {
			next.add(code);
		}
		selectedIds = next;
	}
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
		<h2 class="text-lg font-semibold">Countries</h2>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
				aria-label="Country actions"
			>
				<MoreHorizontal class="size-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					class="z-50 min-w-32 rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
					sideOffset={4}
				>
					<DropdownMenu.Item
						textValue="Add countries"
						class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
					>
						Add countries
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	</div>

	<div class="border-b px-6 py-3">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				placeholder="Search countries…"
				bind:value={searchQuery}
				class="h-9 pl-9"
			/>
		</div>
	</div>

	<div class="overflow-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b text-left">
					<th class="w-10 px-6 py-3">
						<input
							type="checkbox"
							checked={allSelected}
							onchange={toggleAll}
							class="size-4 rounded border-input"
						/>
					</th>
					<th class="px-4 py-3 font-medium text-muted-foreground">Name</th>
					<th class="px-4 py-3 font-medium text-muted-foreground">Code</th>
					<th class="w-12 px-4 py-3"></th>
				</tr>
			</thead>
			<tbody>
				{#each filteredCountries as country (country.code)}
					<tr class="border-b last:border-b-0 hover:bg-muted/50">
						<td class="px-6 py-3">
							<input
								type="checkbox"
								checked={selectedIds.has(country.code)}
								onchange={() => toggleOne(country.code)}
								class="size-4 rounded border-input"
							/>
						</td>
						<td class="px-4 py-3">{country.name}</td>
						<td class="px-4 py-3 font-mono text-muted-foreground">{country.code}</td>
						<td class="px-4 py-3">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex size-7 items-center justify-center rounded-md hover:bg-muted"
									aria-label="Row actions for {country.name}"
								>
									<MoreHorizontal class="size-4" />
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-32 rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
									>
										<DropdownMenu.Item
											textValue="Remove"
											class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
										>
											Remove
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="px-6 py-8 text-center text-muted-foreground">
							No countries found.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
