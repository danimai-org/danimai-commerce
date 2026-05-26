/**
 * Shared order dialog layout. Overrides default full-viewport Dialog.Content
 * (inset-0 h-dvh w-full) so modals are centered and sized to their content.
 */
const orderDialogPosition =
	'!inset-auto !top-1/2 !left-1/2 !flex !h-auto !w-[calc(100vw-2rem)] !max-h-[calc(100dvh-2rem)] !-translate-x-1/2 !-translate-y-1/2 !flex-col !gap-0 !overflow-hidden !rounded-xl !border !bg-background !p-0 !shadow-lg';

export const orderDialogSm = `${orderDialogPosition} !max-w-md`;

export const orderDialogLg = `${orderDialogPosition} !max-w-lg`;

export const orderDialogXl = `${orderDialogPosition} !max-w-3xl`;

export const orderDialogHeader =
	'shrink-0 space-y-0 border-b px-4 py-3 pe-14 text-start sm:px-6 sm:py-4';

export const orderDialogTitle = 'text-base font-semibold leading-none';

export const orderDialogBody = 'shrink-0 px-4 py-4 sm:px-6';

/** Tall scrollable body (shipping address, long forms) */
export const orderDialogBodyScroll =
	'shrink-0 max-h-[min(60dvh,32rem)] overflow-y-auto overscroll-contain px-4 py-4 sm:max-h-[min(70dvh,36rem)] sm:px-6';

/** Main scroll region for flex dialogs (product picker) */
export const orderDialogScrollArea =
	'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6';

export const orderDialogToolbar =
	'shrink-0 border-b px-4 py-3 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-6 sm:py-4';

export const orderDialogFooter =
	'shrink-0 flex flex-row flex-wrap items-center justify-end gap-2 border-t bg-background px-4 py-3 sm:px-6 sm:py-4';

/** Cancel / Save (etc.) grouped on the right in split footers (product picker) */
export const orderDialogFooterActions =
	'ml-auto flex shrink-0 flex-row flex-wrap items-center justify-end gap-2';

export const orderDialogFooterBetween =
	'shrink-0 flex flex-col gap-4 border-t bg-background px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4';

/** Credit card / payment sheet on order flows */
export const orderSheetContent = 'flex h-full w-full flex-col gap-0 sm:max-w-lg';

export const orderSheetHeader = 'shrink-0 border-b px-4 py-3 pe-14 sm:px-6 sm:py-4';

export const orderSheetBody = 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6';

export const orderSheetFooter =
	'shrink-0 flex flex-row flex-wrap items-center justify-end gap-2 border-t bg-background px-4 py-3 sm:px-6 sm:py-4';
