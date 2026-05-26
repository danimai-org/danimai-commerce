<script lang="ts">
	import { resolve } from '$app/paths';
	import { SvelteMap, SvelteSet, SvelteURLSearchParams } from 'svelte/reactivity';
	import type { ComboboxOption } from '$lib/components/organs/combobox/combobox.svelte';
	import { updateCustomer } from '$lib/customers/api';
	import EditShippingAddressModal from '../EditShippingAddressModal.svelte';
	import {
		emptyShippingAddress,
		hasShippingAddress,
		type ShippingAddressValue
	} from '../shipping-address';
	import { client } from '$lib/client';
	import CreateOrderHeader from './CreateOrderHeader.svelte';
	import CreateOrderProductsSection from './CreateOrderProductsSection.svelte';
	import CreateOrderPaymentSection from './CreateOrderPaymentSection.svelte';
	import CreateOrderNotesSection from './CreateOrderNotesSection.svelte';
	import CreateOrderCustomerSection from './CreateOrderCustomerSection.svelte';
	import CreateOrderMarketsSection from './CreateOrderMarketsSection.svelte';
	import CreateOrderTagsSection from './CreateOrderTagsSection.svelte';
	import CreateOrderProductBrowserDialog from './CreateOrderProductBrowserDialog.svelte';
	import CreateOrderMarkAsPaidModal from './CreateOrderMarkAsPaidModal.svelte';
	import CreateOrderCreditCardSheet from './CreateOrderCreditCardSheet.svelte';
	import CreateOrderEditContactModal from './CreateOrderEditContactModal.svelte';
	import CreateOrderNotesModal from './CreateOrderNotesModal.svelte';
	import CreateOrderAddTagsModal from './CreateOrderAddTagsModal.svelte';
	import {
		AVAILABLE_TAGS,
		CUSTOMER_SEARCH_DEBOUNCE_MS,
		PRODUCT_SEARCH_DEBOUNCE_MS,
		PRODUCT_BROWSER_PAGE_SIZE,
		type CreateOrderItem,
		type Pagination,
		type Product,
		type CustomerListItem,
		type SelectedCustomer,
		type CurrencyRow,
		type RegionRow
	} from './types.js';

	let {
		active = false,
		apiBase = 'http://localhost:8000/admin',
		onSuccess,
		onClose
	}: {
		active?: boolean;
		apiBase?: string;
		onSuccess?: (orderId: string) => void;
		onClose?: () => void;
	} = $props();

	let productSearch = $state('');
	let selectedRegion = $state<string>('');
	let selectedCurrency = $state<string>('');
	let notes = $state('');
	let tags = $state('');
	let orderItems = $state<CreateOrderItem[]>([]);
	let discountAmount = $state<number>(0);
	let shippingAmount = $state<number>(0);
	let taxAmount = $state<number>(0);
	let paymentDueLater = $state(false);
	let creditCardSheetOpen = $state(false);
	let billingCountry = $state('India');
	let billingFirstName = $state('');
	let billingLastName = $state('');
	let billingCompany = $state('');
	let billingAddress = $state('');
	let billingApartment = $state('');
	let billingCity = $state('');
	let billingState = $state('');
	let billingPinCode = $state('');
	let billingPhoneCode = $state('+91');
	let billingPhone = $state('');
	let markAsPaidModalOpen = $state(false);
	let notesModalOpen = $state(false);
	let addTagsModalOpen = $state(false);
	let creatingOrder = $state(false);

	let tagSearch = $state('');
	let selectedTagIds = $state<Set<number>>(new Set());

	function openAddTagsModal() {
		addTagsModalOpen = true;
		tagSearch = '';
		const current = tags
			? tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
			: [];
		selectedTagIds = new Set(
			AVAILABLE_TAGS.map((t, i) => (current.includes(t) ? i : -1)).filter((i) => i >= 0)
		);
	}
	function saveTagsModal() {
		tags = AVAILABLE_TAGS.filter((_, i) => selectedTagIds.has(i)).join(', ');
		addTagsModalOpen = false;
	}
	function toggleTag(i: number) {
		const next = new SvelteSet(selectedTagIds);
		if (next.has(i)) next.delete(i);
		else next.add(i);
		selectedTagIds = next;
	}
	const filteredTags = $derived(
		AVAILABLE_TAGS.map((label, i) => ({ label, i })).filter(
			({ label }) => !tagSearch || label.toLowerCase().includes(tagSearch.toLowerCase())
		)
	);
	const selectedTagsList = $derived(
		tags
			? tags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
			: []
	);
	function removeTag(label: string) {
		tags = selectedTagsList.filter((t) => t !== label).join(', ');
	}

	let selectedCustomer = $state<SelectedCustomer | null>(null);
	let editContactModalOpen = $state(false);
	let editContactEmail = $state('');
	let editContactPhone = $state('');
	let editContactUpdateProfile = $state(true);
	let editContactSaving = $state(false);
	let editContactEmailInitial = $state('');
	let editContactPhoneInitial = $state('');
	let editShippingModalOpen = $state(false);
	let editBillingModalOpen = $state(false);
	let shippingAddress = $state<ShippingAddressValue>(emptyShippingAddress());
	let billingAddressForm = $state<ShippingAddressValue>(emptyShippingAddress());

	const editContactDirty = $derived(
		editContactEmail.trim() !== editContactEmailInitial.trim() ||
			editContactPhone.trim() !== editContactPhoneInitial.trim()
	);
	let regions = $state<RegionRow[]>([]);

	let currencies = $state<CurrencyRow[]>([]);
	let currenciesLoading = $state(false);
	let currencyFetchSeq = 0;

	function currencyParenContent(c: { code: string; symbol: string }) {
		if (!c.symbol || c.symbol === c.code) return c.code;
		return `${c.code} ${c.symbol}`;
	}

	function currencyLabel(c: CurrencyRow) {
		return `${c.name} (${currencyParenContent(c)})`;
	}

	function withSelectedCurrencyFallback(
		mapped: ComboboxOption[],
		selectedCode: string
	): ComboboxOption[] {
		const code = selectedCode.trim();
		if (!code || mapped.some((o) => o.id === code)) return mapped;
		const row = selectedCurrencyData;
		if (row) return [{ id: code, value: currencyLabel(row) }, ...mapped];
		return [{ id: code, value: code }, ...mapped];
	}

	const currencyComboboxOptions = $derived.by((): ComboboxOption[] =>
		withSelectedCurrencyFallback(
			currencies.map((c) => ({ id: c.code, value: currencyLabel(c) })),
			selectedCurrency
		)
	);

	const subtotal = $derived(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
	const total = $derived(subtotal + discountAmount + shippingAmount + taxAmount);
	const itemCount = $derived(orderItems.reduce((sum, item) => sum + item.quantity, 0));

	const selectedRegionData = $derived(regions.find((r) => r.id === selectedRegion));
	const selectedCurrencyData = $derived(
		currencies.find((c) => c.code === selectedCurrency) ||
			currencies.find((c) => c.code === selectedRegionData?.currency_code)
	);

	function recalcTaxFromItems(items: CreateOrderItem[]) {
		if (items.length === 0) {
			taxAmount = 0;
			return;
		}
		const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
		taxAmount = Math.round(sum * 0.09 * 100) / 100;
	}

	function addOrderItems(items: CreateOrderItem[]) {
		if (items.length === 0) return;
		orderItems = [...orderItems, ...items];
		recalcTaxFromItems(orderItems);
	}

	function removeOrderItem(id: string) {
		orderItems = orderItems.filter((item) => item.id !== id);
		recalcTaxFromItems(orderItems);
	}
	function updateItemQuantity(id: string, quantity: number) {
		orderItems = orderItems.map((item) =>
			item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
		);
		recalcTaxFromItems(orderItems);
	}
	function formatCurrency(amount: number): string {
		const symbol = selectedCurrencyData?.symbol || '₹';
		return `${symbol}${amount.toFixed(2)}`;
	}

	async function fetchRegions() {
		try {
			const res = await client.regions.get({ query: { page: 1, limit: 100 } });
			if (res.error) return;
			const list = (res.data?.rows ?? []) as {
				id: string;
				name: string;
				currency_code: string;
			}[];
			regions = list;
			ensureOrderMarketDefaults();
		} catch (e) {
			console.error('Failed to fetch regions:', e);
		}
	}

	function ensureOrderMarketDefaults() {
		if (!selectedRegion && regions.length > 0) {
			selectedRegion = regions[0].id;
		}
		if (!selectedCurrency) {
			const region = regions.find((r) => r.id === selectedRegion);
			if (region?.currency_code) {
				selectedCurrency = region.currency_code;
			} else if (currencies.some((c) => c.code === 'INR')) {
				selectedCurrency = 'INR';
			} else if (currencies.length > 0) {
				selectedCurrency = currencies[0].code;
			}
		}
	}
	function mapAvailableCurrency(row: {
		code: string;
		name: string;
		symbol: string;
		id?: string;
	}): CurrencyRow {
		return {
			id: row.id ?? row.code,
			code: row.code,
			name: row.name,
			symbol: row.symbol
		};
	}

	async function fetchCurrenciesFromApi() {
		const seq = ++currencyFetchSeq;
		currenciesLoading = true;
		try {
			const all: CurrencyRow[] = [];
			let page = 1;
			let hasNext = true;
			while (hasNext) {
				const res = await client.currencies.available.get({
					query: { page, limit: 100 }
				});
				if (seq !== currencyFetchSeq) return;
				if (res.error) break;
				const rows = res.data?.data ?? [];
				all.push(...rows.map(mapAvailableCurrency));
				hasNext = res.data?.pagination?.has_next_page ?? false;
				page += 1;
			}
			if (seq === currencyFetchSeq) {
				currencies = all;
				ensureOrderMarketDefaults();
			}
		} catch (e) {
			console.error('Failed to fetch currencies:', e);
			if (seq === currencyFetchSeq) currencies = [];
		} finally {
			if (seq === currencyFetchSeq) currenciesLoading = false;
		}
	}

	let productBrowserOpen = $state(false);
	let productBrowserPage = $state(1);
	let productBrowserSearch = $state('');
	let debouncedProductBrowserSearch = $state('');
	let productBrowserRawData = $state<{
		products?: Product[];
		count?: number;
		offset?: number;
		limit?: number;
	} | null>(null);
	let productBrowserLoading = $state(false);
	let productFetchSeq = 0;
	let selectedProductIds = $state<string[]>([]);
	let addingProducts = $state(false);
	let addSelectedProductsInFlight = false;

	const selectedProductIdSet = $derived(new SvelteSet(selectedProductIds));

	async function fetchProducts() {
		const seq = ++productFetchSeq;
		productBrowserLoading = true;
		try {
			const params = new SvelteURLSearchParams({
				page: String(productBrowserPage),
				limit: String(PRODUCT_BROWSER_PAGE_SIZE),
				sorting_field: 'products.title',
				sorting_direction: 'desc'
			});
			if (debouncedProductBrowserSearch.trim())
				params.append('search', debouncedProductBrowserSearch.trim());
			const res = await fetch(`${apiBase}/products?${params}`, { cache: 'no-store' });
			if (seq !== productFetchSeq) return;
			if (!res.ok) throw new Error(await res.text());
			const json = (await res.json()) as {
				rows?: Product[];
				pagination?: Pagination;
			};
			const pagination = json.pagination;
			const limit = pagination?.limit ?? PRODUCT_BROWSER_PAGE_SIZE;
			const page = pagination?.page ?? 1;
			productBrowserRawData = {
				products: json.rows ?? [],
				count: pagination?.total ?? 0,
				offset: (page - 1) * limit,
				limit
			};
		} catch {
			if (seq === productFetchSeq) productBrowserRawData = null;
		} finally {
			if (seq === productFetchSeq) productBrowserLoading = false;
		}
	}
	function openProductBrowser() {
		selectedProductIds = [];
		productBrowserPage = 1;
		productBrowserSearch = '';
		debouncedProductBrowserSearch = '';
		productBrowserOpen = true;
	}
	function closeProductBrowser() {
		productBrowserOpen = false;
		selectedProductIds = [];
	}
	const productBrowserProducts = $derived(productBrowserRawData?.products ?? []);
	const productBrowserLimit = $derived(productBrowserRawData?.limit ?? 20);
	const productBrowserTotal = $derived(productBrowserRawData?.count ?? 0);
	const productBrowserOffset = $derived(productBrowserRawData?.offset ?? 0);
	const productBrowserPageNum = $derived(
		productBrowserLimit > 0 ? Math.floor(productBrowserOffset / productBrowserLimit) + 1 : 1
	);
	const productBrowserTotalPages = $derived(
		productBrowserLimit > 0 ? Math.ceil(productBrowserTotal / productBrowserLimit) : 1
	);
	const productBrowserPagination = $derived({
		total: productBrowserTotal,
		page: productBrowserPageNum,
		limit: productBrowserLimit,
		total_pages: productBrowserTotalPages,
		has_next_page: productBrowserPageNum < productBrowserTotalPages,
		has_previous_page: productBrowserPageNum > 1
	});
	const productBrowserStart = $derived((productBrowserPageNum - 1) * productBrowserLimit + 1);
	const productBrowserEnd = $derived(
		Math.min(productBrowserPageNum * productBrowserLimit, productBrowserTotal)
	);
	function toggleProductSelection(productId: string) {
		selectedProductIds = selectedProductIds.includes(productId)
			? selectedProductIds.filter((id) => id !== productId)
			: [...selectedProductIds, productId];
	}

	async function addSelectedProducts() {
		if (addSelectedProductsInFlight || addingProducts) return;
		if (selectedProductIds.length === 0) {
			closeProductBrowser();
			return;
		}
		addSelectedProductsInFlight = true;
		addingProducts = true;
		try {
			const productsById = new Map(productBrowserProducts.map((p) => [p.id, p]));
			const orderCurrency = selectedCurrency || 'INR';

			const variantByProductId = new SvelteMap<
				string,
				{ id: string; thumbnail: string | null } | null
			>();
			await Promise.all(
				selectedProductIds.map(async (productId) => {
					try {
						const res = await client['product-variants'].get({
							query: { filters: { product_id: productId }, limit: '1', page: 1 }
						});
						const row = res.data?.rows?.[0];
						variantByProductId.set(
							productId,
							row ? { id: row.id, thumbnail: row.thumbnail ?? null } : null
						);
					} catch {
						variantByProductId.set(productId, null);
					}
				})
			);

			const uniqueVariantIds = [
				...new SvelteSet(
					[...variantByProductId.values()]
						.filter((v): v is { id: string; thumbnail: string | null } => v != null)
						.map((v) => v.id)
				)
			];
			const priceByVariantId = new SvelteMap<string, { price: number; currency: string }>();
			await Promise.all(
				uniqueVariantIds.map(async (variantId) => {
					try {
						const res = await client['product-variants']({ id: variantId }).get();
						if (res.error) return;
						const prices = res.data?.prices ?? [];
						if (!prices.length) return;
						const matchingPrice = prices.find(
							(p) => p.currency_code.toLowerCase() === orderCurrency.toLowerCase()
						);
						const priceToUse = matchingPrice ?? prices[0];
						if (!priceToUse) return;
						priceByVariantId.set(variantId, {
							price: parseFloat(String(priceToUse.amount)) / 100,
							currency: priceToUse.currency_code
						});
					} catch {
						// Variant price is optional; keep defaults when fetch fails.
					}
				})
			);

			const newItems: CreateOrderItem[] = [];
			for (const productId of selectedProductIds) {
				const product = productsById.get(productId);
				if (!product) continue;
				const variant = variantByProductId.get(productId) ?? null;
				let price = 0;
				let currency = orderCurrency;
				if (variant) {
					const priced = priceByVariantId.get(variant.id);
					if (priced) {
						price = priced.price;
						currency = priced.currency;
					}
				}
				newItems.push({
					id: variant?.id ?? productId,
					title: product.title,
					price,
					quantity: 1,
					currency,
					thumbnail: variant?.thumbnail ?? product.thumbnail
				});
			}
			addOrderItems(newItems);
			closeProductBrowser();
		} finally {
			addSelectedProductsInFlight = false;
			addingProducts = false;
		}
	}

	$effect(() => {
		const q = productBrowserSearch;
		const t = setTimeout(() => {
			debouncedProductBrowserSearch = q;
		}, PRODUCT_SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	});
	$effect(() => {
		if (!productBrowserOpen) return;
		void debouncedProductBrowserSearch;
		productBrowserPage = 1;
	});
	$effect(() => {
		if (!productBrowserOpen) return;
		void productBrowserPage;
		void debouncedProductBrowserSearch;
		fetchProducts();
	});

	let customerBrowserOpen = $state(false);
	let customerBrowserPage = $state(1);
	let customerBrowserSearch = $state('');
	let debouncedCustomerBrowserSearch = $state('');

	let selectedCustomerId = $state('');
	let customerComboboxSearch = $state('');
	let debouncedCustomerComboboxSearch = $state('');
	let customerComboboxHasOpened = $state(false);
	let customerComboboxCustomers = $state<CustomerListItem[]>([]);
	let customerComboboxLoading = $state(false);
	let customerComboboxFetchId = 0;

	const customerComboboxSearchPending = $derived(
		customerComboboxSearch.trim() !== debouncedCustomerComboboxSearch.trim()
	);

	function customerDisplayLabel(c: CustomerListItem): string {
		const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
		return name ? `${name} (${c.email})` : c.email;
	}

	const passthroughComboboxOptions = (opts: ComboboxOption[]) => opts;

	const customerComboboxOptions = $derived(
		customerComboboxCustomers.map((c) => ({
			id: c.id,
			value: customerDisplayLabel(c)
		}))
	);

	$effect(() => {
		const q = customerComboboxSearch;
		const t = setTimeout(() => {
			debouncedCustomerComboboxSearch = q;
		}, CUSTOMER_SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	});

	$effect(() => {
		const q = customerBrowserSearch;
		const t = setTimeout(() => {
			debouncedCustomerBrowserSearch = q;
		}, CUSTOMER_SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	});

	async function fetchCustomersList(
		page: number,
		limit: number,
		search: string
	): Promise<{ rows: CustomerListItem[]; pagination: Pagination | null }> {
		const params = new SvelteURLSearchParams({
			page: String(page),
			limit: String(limit)
		});
		if (search.trim()) params.append('search', search.trim());
		const res = await fetch(`${apiBase}/customers?${params}`, { cache: 'no-store' });
		if (!res.ok) throw new Error(await res.text());
		const json = (await res.json()) as {
			rows?: CustomerListItem[];
			pagination?: Pagination;
		};
		return { rows: json.rows ?? [], pagination: json.pagination ?? null };
	}

	async function fetchCustomersForCombobox(search: string) {
		const fetchId = ++customerComboboxFetchId;
		customerComboboxLoading = true;
		try {
			const { rows } = await fetchCustomersList(1, 100, search);
			if (fetchId !== customerComboboxFetchId) return;
			customerComboboxCustomers = rows;
		} catch {
			if (fetchId !== customerComboboxFetchId) return;
			customerComboboxCustomers = [];
		} finally {
			if (fetchId === customerComboboxFetchId) {
				customerComboboxLoading = false;
			}
		}
	}

	function onCustomerComboboxOpen() {
		customerComboboxHasOpened = true;
	}

	function openCreateCustomerInNewTab() {
		window.open(resolve('/customers?create=1', {}), '_blank', 'noopener,noreferrer');
	}

	async function refreshCustomerCombobox() {
		customerComboboxHasOpened = true;
		await fetchCustomersForCombobox(customerComboboxSearch.trim());
	}

	$effect(() => {
		if (!customerComboboxHasOpened) return;
		const search = debouncedCustomerComboboxSearch;
		void fetchCustomersForCombobox(search);
	});

	function applySelectedCustomer(c: CustomerListItem) {
		const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email;
		selectedCustomerId = c.id;
		selectedCustomer = {
			id: c.id,
			name,
			email: c.email,
			phone: c.phone ?? null,
			first_name: c.first_name,
			last_name: c.last_name,
			orderCount: 0
		};
	}

	function openEditShippingModal() {
		if (!selectedCustomer) return;
		editShippingModalOpen = true;
	}

	function openEditContactModal() {
		if (!selectedCustomer) return;
		editContactEmail = selectedCustomer.email;
		editContactPhone = selectedCustomer.phone ?? '';
		editContactEmailInitial = editContactEmail;
		editContactPhoneInitial = editContactPhone;
		editContactUpdateProfile = true;
		editContactModalOpen = true;
	}

	function closeEditContactModal() {
		if (editContactSaving) return;
		editContactModalOpen = false;
	}

	async function saveEditContact() {
		if (!selectedCustomer || !editContactDirty) return;
		editContactSaving = true;
		try {
			const email = editContactEmail.trim();
			const phone = editContactPhone.trim() || null;
			selectedCustomer = { ...selectedCustomer, email, phone };
			if (editContactUpdateProfile) {
				await updateCustomer(selectedCustomer.id, {
					email,
					first_name: selectedCustomer.first_name,
					last_name: selectedCustomer.last_name,
					phone
				});
			}
			editContactModalOpen = false;
		} finally {
			editContactSaving = false;
		}
	}

	function onCustomerComboboxValueChange(id: string) {
		if (!id) {
			selectedCustomer = null;
			return;
		}
		const c = customerComboboxCustomers.find((x) => x.id === id);
		if (c) applySelectedCustomer(c);
	}

	function removeSelectedCustomer() {
		selectedCustomer = null;
		selectedCustomerId = '';
		shippingAddress = emptyShippingAddress();
	}

	function readBillingFields(): ShippingAddressValue {
		return {
			country: billingCountry,
			first_name: billingFirstName,
			last_name: billingLastName,
			company: billingCompany,
			address_1: billingAddress,
			address_2: billingApartment,
			city: billingCity,
			state: billingState,
			postal_code: billingPinCode,
			phone_code: billingPhoneCode,
			phone: billingPhone
		};
	}

	function writeBillingFields(v: ShippingAddressValue) {
		billingCountry = v.country;
		billingFirstName = v.first_name;
		billingLastName = v.last_name;
		billingCompany = v.company;
		billingAddress = v.address_1;
		billingApartment = v.address_2;
		billingCity = v.city;
		billingState = v.state;
		billingPinCode = v.postal_code;
		billingPhoneCode = v.phone_code;
		billingPhone = v.phone;
	}

	function openEditBillingModal() {
		billingAddressForm = readBillingFields();
		editBillingModalOpen = true;
	}

	const billingAddressDisplay = $derived(readBillingFields());

	$effect(() => {
		if (!customerBrowserOpen) return;
		void debouncedCustomerBrowserSearch;
		customerBrowserPage = 1;
	});
	$effect(() => {
		if (!customerBrowserOpen) return;
		void customerBrowserPage;
		void debouncedCustomerBrowserSearch;
	});

	async function createOrder() {
		if (orderItems.length === 0) return;
		ensureOrderMarketDefaults();
		if (!selectedCurrency) {
			alert('Select a currency before creating the order.');
			return;
		}
		creatingOrder = true;
		try {
			const orderData = {
				orders: [
					{
						currency_code: selectedCurrency,
						region_id: selectedRegion || null,
						customer_id: selectedCustomer?.id ?? null,
						email: selectedCustomer?.email ?? null,
						payment_status: 'captured' as const,
						status: 'pending' as const,
						fulfillment_status: 'not_fulfilled' as const,
						metadata: (() => {
							const billingFields = readBillingFields();
							const billing = hasShippingAddress(billingFields)
								? {
										first_name: billingFields.first_name.trim() || null,
										last_name: billingFields.last_name.trim() || null,
										company: billingFields.company.trim() || null,
										address_1: billingFields.address_1.trim() || null,
										address_2: billingFields.address_2.trim() || null,
										city: billingFields.city.trim() || null,
										state: billingFields.state.trim() || null,
										postal_code: billingFields.postal_code.trim() || null,
										country: billingFields.country.trim() || null,
										phone_code: billingFields.phone_code.trim() || null,
										phone: billingFields.phone.trim() || null
									}
								: null;
							const shipping = hasShippingAddress(shippingAddress)
								? {
										first_name: shippingAddress.first_name.trim() || null,
										last_name: shippingAddress.last_name.trim() || null,
										company: shippingAddress.company.trim() || null,
										address_1: shippingAddress.address_1.trim() || null,
										address_2: shippingAddress.address_2.trim() || null,
										city: shippingAddress.city.trim() || null,
										state: shippingAddress.state.trim() || null,
										postal_code: shippingAddress.postal_code.trim() || null,
										country: shippingAddress.country.trim() || null,
										phone_code: shippingAddress.phone_code.trim() || null,
										phone: shippingAddress.phone.trim() || null
									}
								: null;
							const meta: Record<string, unknown> = {
								notes: notes || null,
								tags: tags || null,
								items: orderItems,
								subtotal: subtotal,
								discount_amount: discountAmount,
								shipping_amount: shippingAmount,
								tax_amount: taxAmount,
								total: total,
								billing_address: billing ? JSON.stringify(billing) : null,
								shipping_address: shipping ? JSON.stringify(shipping) : null
							};
							return meta;
						})()
					}
				]
			};
			const res = await client.orders.post(orderData);
			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				throw new Error(err.value?.message ?? 'Failed to create order');
			}
			const createdId = Array.isArray(res.data) ? res.data[0]?.id : undefined;
			if (createdId) {
				onClose?.();
				markAsPaidModalOpen = false;
				creditCardSheetOpen = false;
				onSuccess?.(createdId);
			}
		} catch (e) {
			console.error('Failed to create order:', e);
			alert(e instanceof Error ? e.message : 'Failed to create order');
		} finally {
			creatingOrder = false;
		}
	}

	$effect(() => {
		if (active) {
			productSearch = '';
			selectedRegion = '';
			selectedCurrency = '';
			notes = '';
			tags = '';
			orderItems = [];
			discountAmount = 0;
			shippingAmount = 0;
			taxAmount = 0;
			paymentDueLater = false;
			selectedCustomer = null;
			selectedCustomerId = '';
			editContactModalOpen = false;
			editShippingModalOpen = false;
			editBillingModalOpen = false;
			shippingAddress = emptyShippingAddress();
			billingAddressForm = emptyShippingAddress();
			customerComboboxSearch = '';
			debouncedCustomerComboboxSearch = '';
			customerComboboxHasOpened = false;
			customerComboboxCustomers = [];
			currencies = [];
			void fetchCurrenciesFromApi();
			fetchRegions();
		}
	});
</script>

<div class="flex h-full flex-col bg-muted/30">
	<CreateOrderHeader />
	<div
		class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-4 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]"
	>
		<div class="flex min-w-0 flex-col gap-4 sm:gap-6">
			<CreateOrderProductsSection
				bind:productSearch
				{orderItems}
				{formatCurrency}
				onBrowse={openProductBrowser}
				onRemoveItem={removeOrderItem}
				onUpdateQuantity={updateItemQuantity}
			/>
			<CreateOrderPaymentSection
				orderItemsCount={orderItems.length}
				{itemCount}
				{subtotal}
				{discountAmount}
				{shippingAmount}
				{taxAmount}
				{total}
				bind:paymentDueLater
				{formatCurrency}
				onOpenCreditCard={() => (creditCardSheetOpen = true)}
				onOpenMarkAsPaid={() => (markAsPaidModalOpen = true)}
				onEnsureMarketDefaults={ensureOrderMarketDefaults}
			/>
		</div>
		<div class="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
			<CreateOrderNotesSection {notes} onEdit={() => (notesModalOpen = true)} />
			<CreateOrderCustomerSection
				{selectedCustomer}
				bind:selectedCustomerId
				{customerComboboxOptions}
				customerComboboxLoading={customerComboboxLoading || customerComboboxSearchPending}
				{shippingAddress}
				{billingAddressDisplay}
				onCustomerValueChange={onCustomerComboboxValueChange}
				onCustomerSearchChange={(v) => (customerComboboxSearch = v)}
				{onCustomerComboboxOpen}
				onCreateCustomer={openCreateCustomerInNewTab}
				onRefreshCustomers={refreshCustomerCombobox}
				onEditContact={openEditContactModal}
				onEditShipping={openEditShippingModal}
				onEditBilling={openEditBillingModal}
				onRemoveCustomer={removeSelectedCustomer}
				filterFn={passthroughComboboxOptions}
			/>
			<CreateOrderMarketsSection
				{selectedRegionData}
				bind:selectedCurrency
				{currencyComboboxOptions}
				currencyComboboxLoading={currenciesLoading}
				onCurrencyChange={(v) => (selectedCurrency = v)}
				onCurrencyOpen={() => {
					if (currencies.length === 0 && !currenciesLoading) void fetchCurrenciesFromApi();
				}}
			/>
			<CreateOrderTagsSection
				{selectedTagsList}
				onOpenAddTags={openAddTagsModal}
				onRemoveTag={removeTag}
			/>
		</div>
	</div>
</div>

<CreateOrderProductBrowserDialog
	bind:open={productBrowserOpen}
	bind:search={productBrowserSearch}
	bind:page={productBrowserPage}
	loading={productBrowserLoading}
	adding={addingProducts}
	products={productBrowserProducts}
	selectedProductIds={selectedProductIdSet}
	pagination={productBrowserPagination}
	rangeStart={productBrowserStart}
	rangeEnd={productBrowserEnd}
	onToggleProduct={toggleProductSelection}
	onClose={closeProductBrowser}
	onAddSelected={addSelectedProducts}
/>

<CreateOrderMarkAsPaidModal
	bind:open={markAsPaidModalOpen}
	totalFormatted={formatCurrency(total)}
	{creatingOrder}
	canCreate={orderItems.length > 0}
	onCreate={createOrder}
	onCancel={() => (markAsPaidModalOpen = false)}
/>

<CreateOrderCreditCardSheet
	bind:open={creditCardSheetOpen}
	bind:billingCountry
	bind:billingFirstName
	bind:billingLastName
	bind:billingCompany
	bind:billingAddress
	bind:billingApartment
	bind:billingCity
	bind:billingState
	bind:billingPinCode
	bind:billingPhoneCode
	bind:billingPhone
	totalFormatted={formatCurrency(total)}
	{creatingOrder}
	canCreate={orderItems.length > 0}
	onCreate={() => createOrder()}
	onCancel={() => (creditCardSheetOpen = false)}
/>

<EditShippingAddressModal
	bind:open={editShippingModalOpen}
	bind:value={shippingAddress}
	customerId={selectedCustomer?.id ?? ''}
	customerFirstName={selectedCustomer?.first_name ?? null}
	customerLastName={selectedCustomer?.last_name ?? null}
	customerPhone={selectedCustomer?.phone ?? null}
	saveToCustomerProfile={false}
/>

<EditShippingAddressModal
	bind:open={editBillingModalOpen}
	bind:value={billingAddressForm}
	customerId={selectedCustomer?.id ?? ''}
	customerFirstName={selectedCustomer?.first_name ?? null}
	customerLastName={selectedCustomer?.last_name ?? null}
	customerPhone={selectedCustomer?.phone ?? null}
	title="Edit billing address"
	submitLabel="Done"
	idPrefix="bill"
	saveToCustomerProfile={false}
	onSave={(v) => writeBillingFields(v)}
/>

<CreateOrderEditContactModal
	bind:open={editContactModalOpen}
	bind:email={editContactEmail}
	bind:phone={editContactPhone}
	bind:updateProfile={editContactUpdateProfile}
	saving={editContactSaving}
	canSave={editContactDirty}
	onSave={saveEditContact}
	onCancel={closeEditContactModal}
/>

<CreateOrderNotesModal bind:open={notesModalOpen} bind:notes />

<CreateOrderAddTagsModal
	bind:open={addTagsModalOpen}
	bind:tagSearch
	{filteredTags}
	{selectedTagIds}
	onToggleTag={toggleTag}
	onSave={saveTagsModal}
	onCancel={() => (addTagsModalOpen = false)}
/>
