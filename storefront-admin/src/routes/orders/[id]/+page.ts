import type { PageLoad } from './$types';
import { fetchCustomerInfo, fetchOrder } from '$lib/components/organs/order/detail/load-order.js';

export const load: PageLoad = async ({ params, depends }) => {
	depends(`order:${params.id}`);
	const orderLoad = await fetchOrder(params.id);
	const customer = await fetchCustomerInfo(orderLoad.order?.customer_id);
	return { orderLoad, customer };
};
