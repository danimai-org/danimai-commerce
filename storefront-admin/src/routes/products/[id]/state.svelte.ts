import { writable } from 'svelte/store';
import type { Product } from '$lib/components/organs/product/create/types.js';

const state = writable<{
	product: Product | null;
}>({
	product: null
});

export default state;