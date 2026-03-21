<script lang="ts">
	import { untrack } from 'svelte';
	import { client } from '$lib/client';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Trash_2 from '@lucide/svelte/icons/trash-2';

	type MetadataEntity =
		| 'product'
		| 'product-tag'
		| 'product-category'
		| 'collection'
		| 'product-attribute'
		| 'product-attribute-group'
		| 'region'
		| 'sales-channel';

	interface Props {
		open: boolean;
		productId: string | null | undefined;
		metadata: Record<string, unknown> | null | undefined;
		metadataEntity?: MetadataEntity;
		onSaved: () => void | Promise<void>;
	}

	let {
		open = $bindable(false),
		productId,
		metadata,
		metadataEntity = 'product',
		onSaved
	}: Props = $props();

	let metadataRows = $state<Array<{ key: string; value: string }>>([]);
	let metadataError = $state<string | null>(null);
	let metadataSubmitting = $state(false);

	$effect(() => {
		if (!open || !productId) return;
		const meta = untrack(() => {
			const m = metadata;
			return m && typeof m === 'object' ? (m as Record<string, unknown>) : {};
		});
		const rows = Object.entries(meta).map(([k, v]) => ({ key: k, value: String(v ?? '') }));
		metadataRows = rows.length > 0 ? rows : [{ key: '', value: '' }];
		metadataError = null;
	});

	function closeSheet() {
		open = false;
		metadataError = null;
	}

	function addMetadataRow() {
		metadataRows = [...metadataRows, { key: '', value: '' }];
	}

	function removeMetadataRow(index: number) {
		const next = metadataRows.filter((_, i) => i !== index);
		metadataRows = next.length > 0 ? next : [{ key: '', value: '' }];
	}

	async function putMetadataForEntity(
		entity: MetadataEntity,
		id: string,
		meta: Record<string, string | number>
	) {
		const c = client as Record<string, (args: { id: string }) => { put: (body: unknown) => Promise<unknown> }> &
			typeof client;
		switch (entity) {
			case 'product':
				return client.products({ id }).put({ metadata: meta });
			case 'product-tag':
				return c['product-tags']({ id }).put({ metadata: meta });
			case 'product-category':
				return c['product-categories']({ id }).put({ metadata: meta });
			case 'collection':
				return c.collections({ id }).put({ metadata: meta });
			case 'product-attribute':
				return c['product-attributes']({ id }).put({ metadata: meta, id: id });
			case 'product-attribute-group':
				return c['product-attribute-groups']({ id }).put({ metadata: meta, id: id });
			case 'region':
				return c.regions({ id }).put({ metadata: meta });
			case 'sales-channel':
				return c['sales-channels']({ id }).put({ metadata: meta });
			default:
				return client.products({ id }).put({ metadata: meta });
		}
	}

	async function submitMetadata() {
		if (!productId) {
			metadataError = 'Missing product id.';
			return;
		}
		metadataError = null;
		metadataSubmitting = true;
		try {
			const meta: Record<string, string | number> = {};
			for (const row of metadataRows) {
				const k = row.key.trim();
				if (!k) continue;
				const num = Number(row.value);
				meta[k] = Number.isNaN(num) ? row.value : num;
			}
			const res = await putMetadataForEntity(metadataEntity, productId, meta);
			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				throw new Error(err?.value?.message ?? String(res.error));
			}
			closeSheet();
			await onSaved();
		} catch (e) {
			metadataError = e instanceof Error ? e.message : String(e);
		} finally {
			metadataSubmitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<div class="flex flex-col gap-6">
					<h2 class="text-lg font-semibold">Edit Metadata</h2>

					{#if metadataError}
						<div
							class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{metadataError}
						</div>
					{/if}

					<div class="overflow-hidden rounded-md border">
						<table class="w-full text-sm">
							<thead class="border-b bg-muted/50">
								<tr>
									<th class="px-4 py-3 text-left font-medium">Key</th>
									<th class="px-4 py-3 text-left font-medium">Value</th>
									<th class="w-10 px-4 py-3"></th>
								</tr>
							</thead>
							<tbody>
								{#each metadataRows as _, i}
									<tr class="border-b last:border-0">
										<td class="px-4 py-2">
											<Input
												bind:value={metadataRows[i].key}
												placeholder="Key"
												class="h-9 w-full"
											/>
										</td>
										<td class="px-4 py-2">
											<Input
												bind:value={metadataRows[i].value}
												placeholder="Value"
												class="h-9 w-full"
											/>
										</td>
										<td class="px-4 py-2">
											<Button
												variant="ghost"
												size="icon"
												class="size-8 shrink-0 text-destructive hover:bg-destructive/10"
												onclick={() => removeMetadataRow(i)}
												aria-label="Remove row"
											>
												<Trash_2 class="size-4" />
											</Button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<Button variant="outline" size="sm" onclick={addMetadataRow}>Add row</Button>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeSheet}>Cancel</Button>
				<Button onclick={submitMetadata} disabled={metadataSubmitting || !productId}>
					{metadataSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
