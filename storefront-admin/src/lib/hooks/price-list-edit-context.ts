import { getContext, setContext } from 'svelte';
import type { SuperValidated } from 'sveltekit-superforms';

const PRICE_LIST_UPDATE_FORM_CONTEXT = Symbol('price_list_update_form');

export function setPriceListUpdateFormContext(form: SuperValidated<any>) {
	setContext(PRICE_LIST_UPDATE_FORM_CONTEXT, form);
}

export function getPriceListUpdateFormContext() {
	return getContext<SuperValidated<any>>(PRICE_LIST_UPDATE_FORM_CONTEXT);
}

