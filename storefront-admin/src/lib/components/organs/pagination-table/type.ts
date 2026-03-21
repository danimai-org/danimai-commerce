export type TableColumnAction<T = Record<string, unknown>> = {
	label: string;
	key: string;
	type: 'button';
	onClick: (item: T) => void;
};

export type TableColumn<IRow = Record<string, unknown>> = {
	label: string;
	key: string;
	/** How to render the cell: 'text' (default), 'date', 'boolean', 'actions', 'link' */
	type?: 'text' | 'date' | 'boolean' | 'actions' | 'link';
	/** For type 'actions': list of dropdown items with onClick. When set, openEdit/openDeleteConfirm are ignored for this column. */
	actions?: TableColumnAction<IRow>[];
	/** For type 'link': href from row. If string, used as path (row[key] appended or interpolated). If function, (row) => href. */
	cellHref?: string | ((row: IRow) => string);
	/** For type 'link': optional row key for thumbnail image URL (e.g. 'thumbnail'). */
	thumbnailKey?: string;
	/** For type 'link': row key for link text (e.g. 'title'). Defaults to column.key. Ignored if linkLabel is set. */
	textKey?: string;
	/** For type 'link': static label for the link (e.g. 'View'). */
	linkLabel?: string;
};
