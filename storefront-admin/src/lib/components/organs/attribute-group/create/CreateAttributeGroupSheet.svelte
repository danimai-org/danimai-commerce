<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { client } from '$lib/client.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { untrack } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { toast, Toaster } from 'svelte-sonner';
	import { MultiSelectCombobox } from '../../multi-select-combobox';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import X from '@lucide/svelte/icons/x';
	import { TableHead, type TableColumn } from '$lib/components/organs/index.js';

	type CatalogRow = { id: string; title: string; type: string };

	let {
		open = $bindable(false),

		onSuccess = () => {}
	}: {
		open?: boolean;

		onSuccess?: () => void;
	} = $props();

	let requiredByAttributeId = $state<Record<string, boolean>>({});

	function close() {
		if (!$delayed) open = false;
	}

	const { form, errors, enhance, delayed } = superForm(
		{
			title: '',
			type: 'string' as const,
			attribute_ids: [] as string[],
			rank: 0
		},
		{
			resetForm: true,
			onResult: ({ result }) => {
				if (result.status === 200) {
					toast.success('Attribute group has been created successfully');
					open = false;
					onSuccess();
				}
			}
		}
	);

	const sheetTitle = $derived('Create attribute group');
	const subtitle = $derived('Add a new attribute group.');
	const submitLabel = $derived($delayed ? 'Creating...' : 'Create');

	let searchRows = $state<CatalogRow[]>([]);
	const attributesById = new SvelteMap<string, CatalogRow>();
	let attributesLoading = $state(false);
	let loadRequestId = 0;

	const selectedIds = $derived($form.attribute_ids);

	const attributeOptions = $derived(
		searchRows.map((a) => ({
			id: a.id,
			value: a.title
		}))
	);

	const comboboxOptions = $derived.by(() => {
		const seen = new SvelteSet<string>();
		const out: { id: string; value: string }[] = [];
		for (const o of attributeOptions) {
			if (seen.has(o.id)) continue;
			seen.add(o.id);
			out.push(o);
		}
		for (const id of selectedIds) {
			if (seen.has(id)) continue;
			const row = attributesById.get(id);
			out.push(row ? { id: row.id, value: row.title } : { id, value: id });
			seen.add(id);
		}
		return out;
	});

	const selectedRows = $derived.by(() => {
		const seen = new SvelteSet<string>();
		const out: CatalogRow[] = [];
		for (const id of selectedIds) {
			if (seen.has(id)) continue;
			seen.add(id);
			const row = attributesById.get(id);
			if (row) out.push(row);
			else out.push({ id, title: id, type: '' });
		}
		return out;
	});

	const tableColumns: TableColumn[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'text'
		},
		{ label: 'Type', key: 'type', type: 'text' },
		{ label: 'Required', key: 'required', type: 'boolean' },
		{ label: 'Action', key: 'actions', type: 'actions' }
	];

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

	async function fetchAllCatalogPages(): Promise<CatalogRow[]> {
		const limit = 100;
		const maxPages = 100;
		const out: CatalogRow[] = [];
		for (let page = 1; page <= maxPages; page++) {
			const res = await client['product-attributes'].get({
				query: {
					search: '',
					page,
					limit,
					sorting_field: 'title'
				}
			});
			const rows = normalizeRows((res.data?.rows ?? []) as unknown[]);
			out.push(...rows);
			const p = res.data?.pagination;
			if (!p?.has_next_page || rows.length === 0) break;
		}
		return out;
	}

	function mergeRowsIntoAttributesById(map: SvelteMap<string, CatalogRow>, incoming: CatalogRow[]) {
		for (const row of incoming) {
			map.set(row.id, row);
		}
	}

	async function loadFullCatalog() {
		const id = ++loadRequestId;
		attributesLoading = true;
		try {
			const rows = await fetchAllCatalogPages();
			if (id !== loadRequestId) return;
			searchRows = rows;
			mergeRowsIntoAttributesById(attributesById, rows);
		} catch {
			if (id !== loadRequestId) return;
			searchRows = [];
		} finally {
			if (id === loadRequestId) attributesLoading = false;
		}
	}

	function onComboboxOpen() {
		if (!attributesLoading && searchRows.length === 0) void loadFullCatalog();
	}

	function toggleRequiredForRow(id: string) {
		requiredByAttributeId = {
			...requiredByAttributeId,
			[id]: !(requiredByAttributeId[id] ?? false)
		};
	}

	function removeSelectedRow(id: string) {
		$form.attribute_ids = $form.attribute_ids.filter((x) => x !== id);
	}

	$effect(() => {
		if (!open) {
			searchRows = [];
			attributesById.clear();
			attributesLoading = false;
			requiredByAttributeId = {};
			loadRequestId++;
			return;
		}
		void loadFullCatalog();
	});

	function sameRequiredMap(
		a: Record<string, boolean>,
		b: Record<string, boolean>
	): boolean {
		const ak = Object.keys(a);
		const bk = Object.keys(b);
		if (ak.length !== bk.length) return false;
		for (const k of ak) {
			if (a[k] !== b[k]) return false;
		}
		return true;
	}

	$effect(() => {
		const ids = selectedIds;
		const prev = untrack(() => requiredByAttributeId);
		const next: Record<string, boolean> = {};
		for (const id of ids) {
			next[id] = id in prev ? prev[id]! : false;
		}
		if (sameRequiredMap(prev, next)) return;
		requiredByAttributeId = next;
	});

	const attributesRequiredJson = $derived(JSON.stringify(requiredByAttributeId));
</script>

<Toaster richColors position="top-center" />
<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex h-full w-full max-w-lg flex-col sm:max-w-lg">
		<form method="POST" action="?/create" use:enhance class="flex h-full min-h-0 flex-col">
			<input type="hidden" name="type" value={$form.type} />
			<input type="hidden" name="rank" value={String($form.rank)} />
			<input type="hidden" name="attributes_required_json" value={attributesRequiredJson} />
			{#each $form.attribute_ids as attributeId (attributeId)}
				<input type="hidden" name="attribute_ids" value={attributeId} />
			{/each}
			<div class="min-h-0 flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{sheetTitle}</h2>
				<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="attribute-group-title" class="text-sm font-medium">Title</label>
						<Input
							id="attribute-group-title"
							name="title"
							bind:value={$form.title}
							placeholder="e.g. Specifications"
							aria-invalid={$errors.title ? 'true' : undefined}
							class={cn($errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="attribute-group-attributes" class="text-sm font-medium">Attributes</label>
						<MultiSelectCombobox
							id="attribute-group-attributes"
							options={comboboxOptions}
							bind:value={$form.attribute_ids}
							onOpen={onComboboxOpen}
							loading={attributesLoading}
							showSelectedTable={false}
							placeholder="Search attributes…"
							emptyMessage="No attributes found."
							class="mt-1"
						/>
					</div>

					<section class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
						<div class="border-b border-border bg-muted/40 px-4 py-3">
							<h3 class="flex items-center gap-2 text-sm font-semibold tracking-tight">
								<SlidersHorizontal class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
								Selected attributes
							</h3>
						</div>
						<div class="sm:p-1">
							{#if selectedRows.length === 0}
								<div
									class="m-3 flex min-h-[8rem] items-center justify-center rounded-md border border-dashed border-border/80 bg-muted/15 px-3 py-6"
								>
									<p class="text-center text-sm text-muted-foreground">
										No attribute selected yet.
									</p>
								</div>
							{:else}
								<div
									class="max-h-[min(18rem,calc(100vh-13rem))] min-h-0 overflow-auto px-1 pb-1 sm:px-2 sm:pb-2"
								>
									<table class="w-full border-collapse text-sm">
										<TableHead columns={tableColumns} />
										<tbody class="divide-y divide-border">
											{#each selectedRows as row, i (row.id ?? i)}
												<tr class="hover:bg-muted/40">
													<td class="px-4 py-2.5 font-medium">{row.title}</td>
													<td class="px-4 py-2.5 text-muted-foreground">{row.type}</td>
													<td class="px-4 py-2.5" onclick={(e) => e.stopPropagation()}>
														<div class="flex justify-center">
															<input
																type="checkbox"
																class="h-4 w-4 rounded border-input"
																checked={requiredByAttributeId[row.id] ?? false}
																onchange={() => toggleRequiredForRow(row.id)}
															/>
														</div>
													</td>
													<td class="px-4 py-2.5 text-right" onclick={(e) => e.stopPropagation()}>
														<button
															type="button"
															class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
															aria-label="Remove {row.title}"
															onclick={() => removeSelectedRow(row.id)}
														>
															<X class="size-4" aria-hidden="true" />
														</button>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					</section>
				</div>
			</div>
			<div class="flex shrink-0 justify-end gap-2 border-t border-border p-4">
				<Button variant="outline" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>{submitLabel}</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
