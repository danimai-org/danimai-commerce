<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { cn } from '$lib/utils.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import {
		listAttributes,
		deleteAttributes,
		createAttribute,
		updateAttribute
	} from '$lib/product-attributes/api.js';
	import type { AttributesResponse } from '$lib/product-attributes/types.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';

	const paginationQuery = $derived.by(() => createPaginationQuery($page.url.searchParams));

	const ATTRIBUTE_TYPES = [
		{ value: 'string', label: 'String' },
		{ value: 'number', label: 'Number' },
		{ value: 'boolean', label: 'Boolean' },
		{ value: 'date', label: 'Date' }
	] as const;

	type ProductAttribute = {
		id: string;
		title: string;
		type: string;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	function openCreate() {
		paginateState.openCreate();
		formTitle = '';
		formType = 'string';
	}
	function openEdit(attr: ProductAttribute) {
		(paginateState.openEdit as unknown as (item: ProductAttribute) => void)(attr);
		formTitle = attr.title;
		formType = attr.type;
	}

	const tableColumns: TableColumn[] = [
		{ label: 'Title', key: 'title' },
		{ label: 'Type', key: 'type' },
		{ label: 'Updated', key: 'updated_at', type: 'date' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (row) => openEdit(row as ProductAttribute)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (row) =>
					(paginateState.openDeleteConfirm as unknown as (item: ProductAttribute) => void)(
						row as ProductAttribute
					)
				}
			]
		}
	];

	let formTitle = $state('');
	let formType = $state('string');

	const paginateState = createPagination<AttributesResponse>(
		async (): Promise<AttributesResponse> => {
			const q = paginationQuery as Record<string, unknown>;
			const params = {
				page: q?.page != null ? Number(q.page) : 1,
				limit: q?.limit != null ? Number(q.limit) : 10,
				sorting_field: (q?.sorting_field as string) ?? 'created_at',
				sorting_direction: (q?.sorting_direction as 'asc' | 'desc') ?? 'desc'
			};
			return listAttributes(params);
		},
		['product-attributes']
	);

	$effect(() => {
		$page.url.searchParams.toString();
		paginateState.refetch();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${$page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const queryData = $derived(paginateState.query.data as AttributesResponse | undefined);
	const rawRows = $derived(queryData?.data?.rows ?? []);
	const rows = $derived(rawRows as Record<string, unknown>[]);
	const pagination = $derived((queryData?.data?.pagination ?? null) as PaginationMeta | null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);

	function deleteAttribute(id: string) {
		return deleteAttributes([id]);
	}

	function confirmDeleteAttribute() {
		paginateState.confirmDelete((item) => {
			return deleteAttribute((item as unknown as ProductAttribute).id);
		});
	}

	function closeDeleteConfirm() {
		paginateState.closeDeleteConfirm();
	}

	let formError = $state<string | null>(null);
	let formSubmitting = $state(false);

	async function submitCreate() {
		formError = null;
		if (!formTitle.trim()) {
			formError = 'Title is required';
			return;
		}
		formSubmitting = true;
		try {
			await createAttribute({ title: formTitle.trim(), type: formType });
			paginateState.closeForm();
			paginateState.refetch();
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			formSubmitting = false;
		}
	}

	async function submitEdit() {
		formError = null;
		const item = paginateState.formItem as ProductAttribute | null;
		if (!item?.id) return;
		if (!formTitle.trim()) {
			formError = 'Title is required';
			return;
		}
		formSubmitting = true;
		try {
			await updateAttribute(item.id, { title: formTitle.trim(), type: formType });
			paginateState.closeForm();
			paginateState.refetch();
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			formSubmitting = false;
		}
	}

	function submitForm() {
		if (paginateState.formMode === 'create') {
			submitCreate();
		} else {
			submitEdit();
		}
	}

</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<SlidersHorizontal class="size-4" />
				<span class="font-semibold">Attributes</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
		</div>
		<PaginationTable>
			{#if paginateState.error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{paginateState.error}
				</div>
			{:else if paginateState.loading}
				<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
					<p class="text-muted-foreground">Loading…</p>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody
							rows={rows}
							columns={tableColumns}
							emptyMessage="No attributes found."
						/>
					</table>
				</div>
				<TablePagination
					{pagination}
					{start}
					{end}
					onPageChange={goToPage}
				/>
			{/if}
		</PaginationTable>
	</div>
</div>

<!-- Create / Edit Attribute Sheet -->
<Sheet.Root bind:open={paginateState.formSheetOpen}>
	{#if paginateState.formItem}
		<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
			<div class="flex h-full flex-col">
				<div class="flex-1 overflow-auto p-6 pt-12">
					<h2 class="text-lg font-semibold">
						{paginateState.formMode === 'create' ? 'Create' : 'Edit'} Attribute
					</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						{paginateState.formMode === 'create'
							? 'Add a new product attribute (e.g. Color, Size).'
							: 'Update the attribute title and type.'}
					</p>
					{#if formError && !formSubmitting}
						<div
							class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{formError}
						</div>
					{/if}
					<div class="mt-6 flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<label for="form-title" class="text-sm font-medium">Title</label>
							<Input
								id="form-title"
								bind:value={formTitle}
								placeholder="e.g. Color, Size"
								class={cn('h-9', formError === 'Title is required' && 'border-destructive')}
							/>
						</div>
						<div class="flex flex-col gap-2">
							<label for="form-type" class="text-sm font-medium">Type</label>
							<select
								id="form-type"
								bind:value={formType}
								class="flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs ring-offset-background outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if formType && !ATTRIBUTE_TYPES.some((t) => t.value === formType)}
									<option value={formType}>{formType}</option>
								{/if}
								{#each ATTRIBUTE_TYPES as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
				<div class="flex justify-end gap-2 border-t p-4">
					<Button variant="outline" onclick={() => paginateState.closeForm()}>Cancel</Button>
					<Button onclick={submitForm} disabled={formSubmitting}>
						{formSubmitting ? 'Saving…' : 'Save'}
					</Button>
				</div>
			</div>
		</Sheet.Content>
	{/if}
</Sheet.Root>

<!-- Delete attribute confirmation -->
<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="attribute"
	entityTitle={(paginateState.deleteItem as ProductAttribute | null)?.title || (paginateState.deleteItem as ProductAttribute | null)?.id || ''}
	onConfirm={confirmDeleteAttribute}
	onCancel={closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
/>
