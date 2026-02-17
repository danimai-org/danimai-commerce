# DataTable Component

A reusable table component built with TanStack Table, featuring Material UI-style sorting and selection capabilities.

## Features

- ✅ **Sorting** - Click column headers to sort (ascending/descending)
- ✅ **Row Selection** - Select individual rows or all rows with checkboxes
- ✅ **Pagination** - Built-in pagination with customizable page sizes
- ✅ **Filtering** - Column and global filtering support
- ✅ **Customizable** - Full control over styling and cell rendering
- ✅ **Type-safe** - Full TypeScript support

## Basic Usage

```svelte
<script lang="ts">
	import { DataTable, type ColumnDef } from '$lib/components/organs/data-table/index.js';

	type Product = {
		id: string;
		title: string;
		category: string;
		status: string;
		created_at: string;
	};

	const products: Product[] = [
		{ id: '1', title: 'Product 1', category: 'Electronics', status: 'published', created_at: '2024-01-01' },
		// ... more products
	];

	const columns: ColumnDef<Product>[] = [
		{
			accessorKey: 'title',
			header: 'Title',
			enableSorting: true
		},
		{
			accessorKey: 'category',
			header: 'Category',
			enableSorting: true
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				return <span class="capitalize">{row.original.status}</span>;
			}
		},
		{
			accessorKey: 'created_at',
			header: 'Created',
			cell: ({ row }) => {
				return new Date(row.original.created_at).toLocaleDateString();
			}
		}
	];
</script>

<DataTable data={products} columns={columns} />
```

## With Row Selection

```svelte
<script lang="ts">
	let selectedProducts: Product[] = [];

	function handleSelectionChange(rows: Product[]) {
		selectedProducts = rows;
		console.log('Selected:', rows);
	}
</script>

<DataTable
	data={products}
	columns={columns}
	enableRowSelection={true}
	getRowId={(row) => row.id}
	onRowSelectionChange={handleSelectionChange}
/>
```

## With Custom Actions Column

```svelte
<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const columns: ColumnDef<Product>[] = [
		// ... other columns
		{
			id: 'actions',
			header: 'Actions',
			enableSorting: false,
			cell: ({ row }) => {
				return (
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="flex size-8 items-center justify-center rounded-md hover:bg-muted">
							<MoreHorizontal class="size-4" />
						</DropdownMenu.Trigger>
						<DropdownMenu.Portal>
							<DropdownMenu.Content>
								<DropdownMenu.Item onSelect={() => editProduct(row.original)}>
									<Pencil class="size-4" />
									Edit
								</DropdownMenu.Item>
								<DropdownMenu.Item onSelect={() => deleteProduct(row.original)}>
									<Trash2 class="size-4" />
									Delete
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				);
			}
		}
	];
</script>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `TData[]` | Required | Array of data to display |
| `columns` | `ColumnDef<TData>[]` | Required | Column definitions |
| `enableSorting` | `boolean` | `true` | Enable column sorting |
| `enableRowSelection` | `boolean` | `false` | Enable row selection checkboxes |
| `enablePagination` | `boolean` | `true` | Enable pagination |
| `pageSize` | `number` | `10` | Default page size |
| `onRowSelectionChange` | `(rows: TData[]) => void` | - | Callback when selection changes |
| `emptyMessage` | `string` | `'No results found.'` | Message when no data |
| `class` | `string` | - | Additional CSS classes for table container |
| `headerClass` | `string` | - | Additional CSS classes for header |
| `bodyClass` | `string` | - | Additional CSS classes for body |
| `rowClass` | `string \| ((row: TData) => string)` | - | CSS classes for rows |
| `onRowClick` | `(row: TData) => void` | - | Callback when row is clicked |
| `selectedRowIds` | `string[]` | `[]` | Pre-selected row IDs |
| `getRowId` | `(row: TData) => string` | - | Function to get unique row ID |

## Column Definition

Columns follow TanStack Table's `ColumnDef` structure. Common properties:

- `accessorKey` - Key to access data property
- `header` - Header text or component
- `cell` - Custom cell renderer
- `enableSorting` - Enable sorting for this column
- `meta` - Custom metadata (e.g., `meta.headerClass`, `meta.cellClass`)

See [TanStack Table documentation](https://tanstack.com/table/latest) for full column definition options.
