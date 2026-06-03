<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { parseMetadataFormValue } from '$lib/payment-providers/metadata.js';
	import { metadataToRows, rowsToMetadata } from '$lib/components/organs/metadata/types.js';

	let {
		value = $bindable(''),
		id = 'pp-metadata',
		error = undefined as string | undefined
	}: {
		value?: string | null;
		id?: string;
		error?: string;
	} = $props();

	type MetadataRow = { key: string; value: string };

	let rows = $state<MetadataRow[]>([{ key: '', value: '' }]);
	let syncToken = $state('');

	function rowsToJson(items: MetadataRow[]): string {
		const record = rowsToMetadata(items);
		return Object.keys(record).length > 0 ? JSON.stringify(record, null, 2) : '';
	}

	function jsonToRows(raw: string | null | undefined): MetadataRow[] {
		const trimmed = (raw ?? '').trim();
		if (!trimmed) return [{ key: '', value: '' }];
		try {
			const parsed = parseMetadataFormValue(trimmed, 'omit');
			if (!parsed) return [{ key: '', value: '' }];
			return metadataToRows(parsed);
		} catch {
			return [{ key: '', value: '' }];
		}
	}

	function pushValue(next: string) {
		const normalized = next ?? '';
		if (normalized === (value ?? '')) return;
		syncToken = normalized;
		value = normalized;
	}

	function updateRows(next: MetadataRow[]) {
		rows = next;
		pushValue(rowsToJson(next));
	}

	$effect(() => {
		const external = value ?? '';
		if (external === syncToken) return;
		syncToken = external;
		rows = jsonToRows(external);
	});

	function addRow() {
		updateRows([...rows, { key: '', value: '' }]);
	}

	function removeRow(index: number) {
		const next = rows.filter((_, i) => i !== index);
		updateRows(next.length > 0 ? next : [{ key: '', value: '' }]);
	}

	function onKeyChange(index: number, key: string) {
		updateRows(rows.map((row, i) => (i === index ? { ...row, key } : row)));
	}

	function onValueChange(index: number, entry: string) {
		updateRows(rows.map((row, i) => (i === index ? { ...row, value: entry } : row)));
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center justify-between">
		<label for={id} class="text-sm font-medium">Metadata (optional)</label>
		<Button type="button" variant="outline" size="sm" class="h-8" onclick={addRow}>
			<Plus class="mr-1 size-3.5" />
			Add
		</Button>
	</div>

	<div class="overflow-hidden rounded-md border">
		<table class="w-full text-sm">
			<thead class="border-b bg-muted/50">
				<tr>
					<th class="px-3 py-2 text-left font-medium">Key</th>
					<th class="px-3 py-2 text-left font-medium">Value</th>
					<th class="w-10 px-2 py-2"></th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row, index (index)}
					<tr class="border-b last:border-0">
						<td class="px-2 py-2">
							<Input
								id={index === 0 ? id : undefined}
								placeholder="Key"
								value={row.key}
								oninput={(e) => onKeyChange(index, e.currentTarget.value)}
								class="h-9 w-full"
								aria-invalid={error ? 'true' : undefined}
							/>
						</td>
						<td class="px-2 py-2">
							<Input
								placeholder="Value"
								value={row.value}
								oninput={(e) => onValueChange(index, e.currentTarget.value)}
								class="h-9 w-full"
								aria-invalid={error ? 'true' : undefined}
							/>
						</td>
						<td class="px-2 py-2">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								class="size-8 shrink-0 text-muted-foreground hover:text-destructive"
								disabled={rows.length === 1 && !row.key && !row.value}
								onclick={() => removeRow(index)}
								aria-label="Remove metadata row"
							>
								<Trash2 class="size-4" />
							</Button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<input type="hidden" name="metadata" value={value ?? ''} />

	<p class="text-xs text-muted-foreground">Add key-value pairs (e.g. api_key for provider credentials).</p>
	{#if error}
		<span class="text-xs text-destructive">{error}</span>
	{/if}
</div>
