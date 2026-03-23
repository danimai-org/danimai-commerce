<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import List from '@lucide/svelte/icons/list';

	type AttributeRow = { id: string; title: string; type: string };

	interface Props {
		attributes: AttributeRow[] | undefined;
	}

	let { attributes }: Props = $props();

	let attributesSearchQuery = $state('');

	const attributeTableColumns: TableColumn<AttributeRow>[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'link',
			cellHref: (row) => resolve(`/products/attributes/${String(row.id ?? '')}`, {}),
			textKey: 'title'
		},
		{ label: 'Type', key: 'type', type: 'text' }
	];

	const attributeRows = $derived(
		(attributes ?? []).filter((attribute) => {
			if (!attribute.title) return false;
			const q = attributesSearchQuery.trim().toLowerCase();
			if (!q) return true;
			return (
				attribute.title.toLowerCase().includes(q) || attribute.type.toLowerCase().includes(q)
			);
		})
	);
</script>

<section class="overflow-hidden rounded-lg border bg-card shadow-sm">
	<div class="flex flex-wrap items-start justify-between gap-2 border-b bg-card px-6 py-4">
		<div class="min-w-0 flex-1">
			<h2 class="flex items-center gap-2 text-base font-semibold">
				<List class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
				Attributes
			</h2>
			<p class="mt-0.5 text-sm text-muted-foreground">
				Attributes assigned to this group. Assign this group to a product to show these attributes.
			</p>
		</div>
	</div>
	<div class="overflow-x-auto p-4">
		<PaginationTable
			bind:searchQuery={attributesSearchQuery}
			searchPlaceholder="Search attributes"
			showFilter={false}
			showSort={false}
		>
			<div class="min-h-0 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<TableHead columns={attributeTableColumns} />
					<TableBody
						rows={attributeRows}
						columns={attributeTableColumns as TableColumn[]}
						emptyMessage="No attributes in this group."
					/>
				</table>
			</div>
		</PaginationTable>
	</div>
</section>
