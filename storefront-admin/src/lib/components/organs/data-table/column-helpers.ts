import type { ColumnDef } from '@tanstack/svelte-table';

/**
 * Helper to create common column definitions
 */
export const columnHelpers = {
	/**
	 * Creates a column definition for row selection checkbox
	 * Note: The DataTable component handles selection checkboxes automatically
	 * when enableRowSelection is true, so this is mainly for reference
	 */
	createSelectColumn<TData>(): ColumnDef<TData> {
		return {
			id: 'select',
			enableSorting: false,
			enableHiding: false,
			size: 40,
			header: 'Select',
			cell: () => ''
		};
	}
};
