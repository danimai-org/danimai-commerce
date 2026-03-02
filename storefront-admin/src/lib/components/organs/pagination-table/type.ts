export type TableColumnAction = {
	label: string;
	key: string;
	type: 'button';
	onClick: (item: Record<string, unknown>) => void;
};

export type TableColumn = {
	label: string;
	key: string;
	/** How to render the cell: 'text' (default), 'date', 'boolean', 'actions' */
	type?: 'text' | 'date' | 'boolean' | 'actions';
	/** For type 'actions': list of dropdown items with onClick. When set, openEdit/openDeleteConfirm are ignored for this column. */
	actions?: TableColumnAction[];
};
