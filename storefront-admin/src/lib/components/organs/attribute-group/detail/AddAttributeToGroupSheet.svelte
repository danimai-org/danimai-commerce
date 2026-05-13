<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { client } from '$lib/client.js';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { toast, Toaster } from 'svelte-sonner';
	import { MultiSelectCombobox } from '../../multi-select-combobox';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { TableHead, TableBody, type TableColumn } from '$lib/components/organs/index.js';

	type CatalogRow = { id: string; title: string; type: string };

	let {
		open = $bindable(false),
		groupId = '',
		groupTitle = '',
		groupMetadata = null as unknown | null,
		currentAttributeIds = [] as string[],
		onSuccess = () => {}
	}: {
		open?: boolean;
		groupId?: string;
		groupTitle?: string;
		groupMetadata?: unknown | null;
		currentAttributeIds?: string[];
		onSuccess?: () => void | Promise<void>;
	} = $props();

	let selectedToAdd = $state<string[]>([]);
	let searchRows = $state<CatalogRow[]>([]);
	const attributesById = new SvelteMap<string, CatalogRow>();
	let attributesLoading = $state(false);
	let submitting = $state(false);

	let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;
	let searchRequestId = 0;

	const alreadyInGroup = $derived(new SvelteSet(currentAttributeIds));

	const attributeOptions = $derived(
		searchRows.map((a) => ({
			id: a.id,
			value: a.title
		}))
	);

	const comboboxOptions = $derived(attributeOptions.filter((o) => !alreadyInGroup.has(o.id)));

	const selectedRows = $derived.by(() => {
		const seen = new SvelteSet<string>();
		const out: CatalogRow[] = [];
		for (const id of selectedToAdd) {
			if (seen.has(id)) continue;
			seen.add(id);
			const row = attributesById.get(id);
			if (row) out.push(row);
		}
		return out;
	});

	type AttributeRow = CatalogRow;

	const tableColumns: TableColumn<AttributeRow>[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'text'
		},
		{ label: 'Type', key: 'type', type: 'text' }
	];

	function metadataPayload(): Record<string, string | number> {
		if (groupMetadata != null && typeof groupMetadata === 'object' && !Array.isArray(groupMetadata)) {
			const out: Record<string, string | number> = {};
			for (const [k, v] of Object.entries(groupMetadata as Record<string, unknown>)) {
				if (typeof v === 'string' || typeof v === 'number') out[k] = v;
			}
			if (Object.keys(out).length > 0) return out;
		}
		return { rank: 0 };
	}

	function close() {
		if (!submitting) open = false;
	}

	function normalizeRows(rows: unknown[]): CatalogRow[] {
		const out: CatalogRow[] = [];
		for (const raw of rows) {
			if (raw == null || typeof raw !== 'object') continue;
			const r = raw as Record<string, unknown>;
			const idRaw = r.id;
			if (idRaw == null || idRaw === '') continue;
			const id = typeof idRaw === 'string' ? idRaw : String(idRaw);
			const title =
				typeof r.title === 'string' ? r.title : r.title != null ? String(r.title) : '';
			const typeRaw = r.type;
			const type =
				typeof typeRaw === 'string' ? typeRaw : typeRaw != null ? String(typeRaw) : '';
			out.push({ id, title, type });
		}
		return out;
	}

	async function fetchAttributes(search: string): Promise<CatalogRow[]> {
		const res = await client['product-attributes'].get({
			query: {
				search: search.trim(),
				page: 1,
				limit: 100,
				sorting_field: 'created_at'
			}
		});
		const rows = res.data?.rows ?? [];
		return normalizeRows(rows as unknown[]);
	}

	function mergeRowsIntoAttributesById(map: SvelteMap<string, CatalogRow>, incoming: CatalogRow[]) {
		for (const row of incoming) {
			map.set(row.id, row);
		}
	}

	async function runAttributeSearch(query: string) {
		const id = ++searchRequestId;
		attributesLoading = true;
		try {
			const rows = await fetchAttributes(query);
			if (id !== searchRequestId) return;
			searchRows = rows;
			mergeRowsIntoAttributesById(attributesById, rows);
		} catch {
			if (id !== searchRequestId) return;
			searchRows = [];
		} finally {
			if (id === searchRequestId) attributesLoading = false;
		}
	}

	function scheduleAttributeSearch(query: string) {
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => {
			searchDebounceTimer = undefined;
			void runAttributeSearch(query);
		}, 300);
	}

	function onComboboxOpen() {
		if (!attributesLoading && searchRows.length === 0) {
			void runAttributeSearch('');
		}
	}

	$effect(() => {
		if (!open) {
			selectedToAdd = [];
			searchRows = [];
			attributesById.clear();
			attributesLoading = false;
			if (searchDebounceTimer) {
				clearTimeout(searchDebounceTimer);
				searchDebounceTimer = undefined;
			}
			searchRequestId++;
			return;
		}
		selectedToAdd = [];
		searchRows = [];
		attributesById.clear();
		void runAttributeSearch('');
	});

	async function submit(e: Event) {
		e.preventDefault();
		if (!groupId) {
			toast.error('Missing attribute group');
			return;
		}
		const newIds = selectedToAdd.filter((id) => !alreadyInGroup.has(id));
		if (newIds.length === 0) {
			toast.error('Select at least one attribute that is not already in this group');
			return;
		}

		const nextIds = [...currentAttributeIds, ...newIds];

		submitting = true;
		try {
			const updated = await client['product-attribute-groups']({ id: groupId }).put({
				id: groupId,
				title: groupTitle.trim() || groupId,
				metadata: metadataPayload(),
				attributes: nextIds.map((attribute_id) => ({ attribute_id }))
			});

			if (
				updated == null ||
				(typeof updated === 'object' &&
					'error' in updated &&
					(updated as { error?: unknown }).error)
			) {
				toast.error('Could not update this group');
				return;
			}

			toast.success(
				newIds.length === 1 ? 'Attribute added to group' : `${newIds.length} attributes added to group`
			);
			open = false;
			await onSuccess();
		} finally {
			submitting = false;
		}
	}
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form onsubmit={submit} class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Add attributes</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Select existing attributes from your catalog to attach to this group.
				</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="add-to-group-attributes" class="text-sm font-medium">Attributes</label>
						<MultiSelectCombobox
							id="add-to-group-attributes"
							options={comboboxOptions}
							bind:value={selectedToAdd}
							onOpen={onComboboxOpen}
							onSearchChange={scheduleAttributeSearch}
							loading={attributesLoading}
							filterFn={(opts) => opts}
							showSelectedTable={false}
							placeholder="Type to add…"
							emptyMessage="No attributes found."
							class="mt-1"
						/>
					</div>

					<section class="overflow-hidden rounded-lg border bg-card shadow-sm">
						<div class="border-b bg-muted/40 px-4 py-3">
							<h3 class="flex items-center gap-2 text-sm font-semibold">
								<SlidersHorizontal class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
								Selected attributes
							</h3>
						</div>
						<div class="p-3 sm:p-4">
							{#if selectedRows.length === 0}
								<div
									class="flex min-h-[8rem] items-center justify-center rounded-lg border border-dashed bg-muted/20 px-3 py-6"
								>
									<p class="text-center text-sm text-muted-foreground">
										No attribute selected yet.
									</p>
								</div>
							{:else}
								<div class="max-h-[14rem] min-h-0 overflow-auto rounded-lg border bg-card">
									<table class="w-full text-sm">
										<TableHead columns={tableColumns} />
										<TableBody
											rows={selectedRows}
											columns={tableColumns as TableColumn[]}
											emptyMessage="No attributes found."
										/>
									</table>
								</div>
							{/if}
						</div>
					</section>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" disabled={submitting} onclick={close}>Cancel</Button>
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Saving…' : 'Add to group'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
