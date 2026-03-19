<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import EditTaxRateSheet from './EditTaxRateSheet.svelte';

	interface Props {
		regionId?: string;
		rates?: any[];
	}

	type TaxRateRow = {
		id: string;
		name: string;
		code: string;
		rate: string;
		createdAt: string;
	};

	let { regionId: _regionId, rates = [] }: Props = $props();

	let sheetOpen = $state(false);

	function formatDate(value: unknown): string {
		if (!value) return '—';
		const date = new Date(value as string | Date);
		if (Number.isNaN(date.getTime())) return '—';
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatRate(value: unknown): string {
		if (typeof value === 'number') return `${value}%`;
		if (typeof value === 'string' && value.trim() !== '') return `${value}%`;
		return '—';
	}

	const rows = $derived.by(() =>
		(rates ?? []).map((item) => ({
			id: String(item?.id ?? ''),
			name: String(item?.name ?? item?.code ?? '—'),
			code: String(item?.code ?? '—'),
			rate: formatRate(item?.rate),
			createdAt: formatDate(item?.created_at)
		}))
	);
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
		<h2 class="text-lg font-semibold">Tax Rates</h2>
		<Button size="sm" variant="outline" onclick={() => (sheetOpen = true)}>Add rate</Button>
	</div>

	<div class="overflow-auto">
		<table class="w-full text-sm">
			<thead class="border-b text-left">
				<tr>
					<th class="px-6 py-3 font-medium text-muted-foreground">Name</th>
					<th class="px-4 py-3 font-medium text-muted-foreground">Code</th>
					<th class="px-4 py-3 font-medium text-muted-foreground">Rate</th>
					<th class="px-4 py-3 font-medium text-muted-foreground">Created</th>
				</tr>
			</thead>
			<tbody>
				{#if rows.length === 0}
					<tr>
						<td colspan={4} class="px-6 py-8 text-center text-muted-foreground">No tax rates found.</td>
					</tr>
				{:else}
					{#each rows as row (row.id)}
						<tr class="border-b last:border-b-0">
							<td class="px-6 py-3 font-medium">{row.name}</td>
							<td class="px-4 py-3 text-muted-foreground">{row.code}</td>
							<td class="px-4 py-3 text-muted-foreground">{row.rate}</td>
							<td class="px-4 py-3 text-muted-foreground">{row.createdAt}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<EditTaxRateSheet bind:open={sheetOpen} regionId={_regionId} title="Add Tax Rate" />
