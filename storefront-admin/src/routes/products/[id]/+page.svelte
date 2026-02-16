<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Package from '@lucide/svelte/icons/package';
	import Bell from '@lucide/svelte/icons/bell';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Upload from '@lucide/svelte/icons/upload-cloud';
	import Share2 from '@lucide/svelte/icons/share-2';
	import Truck from '@lucide/svelte/icons/truck';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import Ruler from '@lucide/svelte/icons/ruler';
	import Lock from '@lucide/svelte/icons/lock';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import X from '@lucide/svelte/icons/x';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { DropdownMenu } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000';

	type ProductAttribute = {
		id: string;
		title: string;
		type: string;
		value: string;
	};

	type Product = {
		id: string;
		title: string;
		handle: string;
		subtitle: string | null;
		description: string | null;
		status: string;
		thumbnail: string | null;
		category_id: string | null;
		discountable?: boolean;
		metadata?: Record<string, string | number> | null;
		collection?: { id: string; title: string; handle: string } | null;
		collections?: Array<{ id: string; title: string; handle: string }>;
		collection_ids?: string[];
		attributes?: ProductAttribute[];
		tag_ids?: string[];
		tags?: Array<{ id: string; value: string }>;
		created_at: string;
		updated_at: string;
	};

	type ProductOption = {
		id: string;
		title: string;
		product_id: string | null;
	};

	type ProductVariant = {
		id: string;
		title: string;
		sku: string | null;
		product_id: string | null;
		manage_inventory: boolean;
		allow_backorder?: boolean;
		barcode?: string | null;
		ean?: string | null;
		upc?: string | null;
		created_at: string;
		updated_at: string;
	};

	type ProductCategory = { id: string; value: string; handle: string };
	type ProductCollection = { id: string; title: string; handle: string };

	const productId = $derived($page.params.id);

	let product = $state<Product | null>(null);
	let options = $state<ProductOption[]>([]);
	let variants = $state<ProductVariant[]>([]);
	let category = $state<ProductCategory | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Sales Channels
	type SalesChannel = { id: string; name: string; is_default: boolean };
	let salesChannelsSheetOpen = $state(false);
	let allSalesChannels = $state<SalesChannel[]>([]);
	let productSalesChannelIds = $state<Set<string>>(new Set());
	let salesChannelsSearchQuery = $state('');
	let salesChannelsSubmitting = $state(false);

	// Option values: when single option, use variant titles as values
	const optionValues = $derived.by(() => {
		if (options.length !== 1 || variants.length === 0) return [] as string[];
		const titles = [...new Set(variants.map((v) => v.title.trim()).filter(Boolean))];
		return titles;
	});

	async function loadProduct() {
		if (!productId) return;
		loading = true;
		error = null;
		try {
			const res = await fetch(`${API_BASE}/products/${productId}`, { cache: 'no-store' });
			if (!res.ok) {
				if (res.status === 404) {
					error = 'Product not found';
					return;
				}
				throw new Error(await res.text());
			}
			product = (await res.json()) as Product;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			product = null;
		} finally {
			loading = false;
		}
	}

	async function loadOptionsAndVariants() {
		if (!productId) return;
		try {
			const [optRes, varRes] = await Promise.all([
				fetch(`${API_BASE}/product-options?limit=100`, { cache: 'no-store' }),
				fetch(`${API_BASE}/product-variants?limit=100`, { cache: 'no-store' })
			]);
			if (optRes.ok) {
				const j = (await optRes.json()) as { data?: ProductOption[] };
				options = (j.data ?? []).filter((o) => o.product_id === productId);
			} else {
				options = [];
			}
			if (varRes.ok) {
				const j = (await varRes.json()) as { data?: ProductVariant[] };
				variants = (j.data ?? []).filter((v) => v.product_id === productId);
			} else {
				variants = [];
			}
		} catch {
			options = [];
			variants = [];
		}
	}

	async function loadCategory() {
		if (!product?.category_id) {
			category = null;
			return;
		}
		try {
			const res = await fetch(`${API_BASE}/product-categories?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as { data?: ProductCategory[] };
				category = (j.data ?? []).find((c) => c.id === product!.category_id) ?? null;
			} else {
				category = null;
			}
		} catch {
			category = null;
		}
	}

	$effect(() => {
		productId;
		loadProduct();
	});

	$effect(() => {
		if (product?.id) {
			loadOptionsAndVariants();
			// Fetch product sales channels and all sales channels
			fetchProductSalesChannels();
			fetchSalesChannels();
		} else {
			options = [];
			variants = [];
		}
	});

	async function fetchSalesChannels() {
		try {
			const res = await fetch(`${API_BASE}/sales-channels?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as { data?: SalesChannel[] };
				allSalesChannels = j.data ?? [];
			} else {
				allSalesChannels = [];
			}
		} catch {
			allSalesChannels = [];
		}
	}

	async function fetchProductSalesChannels() {
		if (!productId) return;
		try {
			const res = await fetch(`${API_BASE}/sales-channels/products/${productId}/sales-channels`, { cache: 'no-store' });
			if (res.ok) {
				const channels = (await res.json()) as SalesChannel[];
				productSalesChannelIds = new Set(channels.map((ch) => ch.id));
			} else {
				productSalesChannelIds = new Set();
			}
		} catch {
			productSalesChannelIds = new Set();
		}
	}

	async function updateProductSalesChannels() {
		if (!productId) return;
		salesChannelsSubmitting = true;
		try {
			const salesChannelIds = Array.from(productSalesChannelIds);
			const res = await fetch(`${API_BASE}/sales-channels/products/${productId}/sales-channels`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sales_channel_ids: salesChannelIds })
			});
			if (res.ok) {
				await fetchProductSalesChannels();
				salesChannelsSheetOpen = false;
			} else {
				const text = await res.text();
				error = text || 'Failed to update sales channels';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			salesChannelsSubmitting = false;
		}
	}

	const filteredSalesChannels = $derived(
		allSalesChannels.filter((ch) =>
			ch.name.toLowerCase().includes(salesChannelsSearchQuery.toLowerCase())
		)
	);

	$effect(() => {
		if (product?.category_id) {
			loadCategory();
		} else {
			category = null;
		}
	});

	const handleDisplay = $derived(
		product?.handle ? (product.handle.startsWith('/') ? product.handle : `/${product.handle}`) : '—'
	);

	const formatDate = (s: string) => {
		try {
			return new Date(s).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			});
		} catch {
			return '—';
		}
	};

	let variantPage = $state(1);
	const variantLimit = 10;
	const variantTotal = $derived(variants.length);
	const variantTotalPages = $derived(Math.max(1, Math.ceil(variantTotal / variantLimit)));
	const paginatedVariants = $derived(
		variants.slice((variantPage - 1) * variantLimit, variantPage * variantLimit)
	);
	const variantStart = $derived((variantPage - 1) * variantLimit + 1);
	const variantEnd = $derived(Math.min(variantPage * variantLimit, variantTotal));

	let editSheetOpen = $state(false);
	let editTitle = $state('');
	let editSubtitle = $state('');
	let editHandle = $state('');
	let editDescription = $state('');
	let editStatus = $state<'draft' | 'proposed' | 'published' | 'rejected'>('draft');
	let editDiscountable = $state(true);
	let editProductAttributesList = $state<EditAttributeRow[]>([]);
	let editProductAddAttributeId = $state('');
	let editProductAddAttributeValue = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	let orgSheetOpen = $state(false);
	let orgCollectionIds = $state<string[]>([]);
	let orgCategoryId = $state('');
	let orgTagIds = $state<string[]>([]);
	let orgError = $state<string | null>(null);
	let orgSubmitting = $state(false);
	let collectionsList = $state<ProductCollection[]>([]);
	let categoriesList = $state<ProductCategory[]>([]);
	let tagsList = $state<Array<{ id: string; value: string }>>([]);

	type EditAttributeRow = { attribute_id: string; title: string; value: string };
	let editAttributesSheetOpen = $state(false);
	let editAttributesList = $state<EditAttributeRow[]>([]);
	let availableAttributesList = $state<Array<{ id: string; title: string; type: string }>>([]);
	let editAttributesSubmitting = $state(false);
	let editAttributesError = $state<string | null>(null);
	let addAttributeId = $state('');
	let addAttributeValue = $state('');

	async function openEditSheet() {
		if (!product || !product.id) {
			await loadProduct();
			if (!product || !product.id) return;
		}
		editSheetOpen = true;
		editTitle = product.title ?? '';
		editSubtitle = product.subtitle ?? '';
		editHandle = product.handle ? (product.handle.startsWith('/') ? product.handle.slice(1) : product.handle) : '';
		editDescription = product.description ?? '';
		editStatus = (product.status as 'draft' | 'proposed' | 'published' | 'rejected') || 'draft';
		editDiscountable = product.discountable !== false;
		editProductAttributesList = (product.attributes ?? []).map((a) => ({
			attribute_id: a.id,
			title: a.title,
			value: a.value
		}));
		editProductAddAttributeId = '';
		editProductAddAttributeValue = '';
		editError = null;
		loadAvailableAttributes();
	}

	const editProductAttributesAvailableToAdd = $derived(
		availableAttributesList.filter((a) => !editProductAttributesList.some((e) => e.attribute_id === a.id))
	);

	function removeEditProductAttribute(index: number) {
		editProductAttributesList = editProductAttributesList.filter((_, i) => i !== index);
	}

	function addEditProductAttribute() {
		if (!editProductAddAttributeId) return;
		const att = availableAttributesList.find((a) => a.id === editProductAddAttributeId);
		if (!att) return;
		editProductAttributesList = [
			...editProductAttributesList,
			{ attribute_id: att.id, title: att.title, value: editProductAddAttributeValue.trim() }
		];
		editProductAddAttributeId = '';
		editProductAddAttributeValue = '';
	}

	function closeEditSheet() {
		editSheetOpen = false;
		editError = null;
	}

	async function submitEditProduct() {
		if (!product) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const handle =
				editHandle.trim() ||
				editTitle
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^a-z0-9-]/g, '');
			const body: Record<string, unknown> = {
				title: editTitle.trim(),
				subtitle: editSubtitle.trim() || undefined,
				description: editDescription.trim() || undefined,
				handle,
				status: editStatus,
				discountable: editDiscountable,
				attributes: editProductAttributesList.map((a) => ({ attribute_id: a.attribute_id, value: a.value }))
			};
			const res = await fetch(`${API_BASE}/products/${product.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEditSheet();
			loadProduct();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	async function loadAvailableAttributes() {
		try {
			const res = await fetch(`${API_BASE}/product-attributes?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as { data?: Array<{ id: string; title: string; type: string }> };
				availableAttributesList = j.data ?? [];
			} else {
				availableAttributesList = [];
			}
		} catch {
			availableAttributesList = [];
		}
	}

	async function openEditAttributesSheet() {
		if (!product || !product.id) {
			await loadProduct();
			if (!product || !product.id) return;
		}
		editAttributesList = (product.attributes ?? []).map((a) => ({
			attribute_id: a.id,
			title: a.title,
			value: a.value
		}));
		addAttributeId = '';
		addAttributeValue = '';
		editAttributesError = null;
		editAttributesSheetOpen = true;
		loadAvailableAttributes();
	}

	function closeEditAttributesSheet() {
		editAttributesSheetOpen = false;
		editAttributesError = null;
	}

	function removeAttributeFromEdit(index: number) {
		editAttributesList = editAttributesList.filter((_, i) => i !== index);
	}

	function addAttributeToEdit() {
		if (!addAttributeId) return;
		const att = availableAttributesList.find((a) => a.id === addAttributeId);
		if (!att) return;
		editAttributesList = [...editAttributesList, { attribute_id: att.id, title: att.title, value: addAttributeValue.trim() }];
		addAttributeId = '';
		addAttributeValue = '';
	}

	const attributesAvailableToAdd = $derived(
		availableAttributesList.filter((a) => !editAttributesList.some((e) => e.attribute_id === a.id))
	);

	async function submitEditAttributes() {
		if (!product) return;
		editAttributesError = null;
		editAttributesSubmitting = true;
		try {
			const body = {
				attributes: editAttributesList.map((a) => ({ attribute_id: a.attribute_id, value: a.value }))
			};
			const res = await fetch(`${API_BASE}/products/${product.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEditAttributesSheet();
			loadProduct();
		} catch (e) {
			editAttributesError = e instanceof Error ? e.message : String(e);
		} finally {
			editAttributesSubmitting = false;
		}
	}

	async function loadCollectionsList() {
		try {
			const res = await fetch(`${API_BASE}/collections?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as {
					data?: ProductCollection[];
					collections?: ProductCollection[];
				};
				collectionsList = j.data ?? j.collections ?? [];
			} else {
				collectionsList = [];
			}
		} catch {
			collectionsList = [];
		}
	}

	async function loadCategoriesList() {
		try {
			const res = await fetch(`${API_BASE}/product-categories?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as { data?: ProductCategory[] };
				categoriesList = j.data ?? [];
			} else {
				categoriesList = [];
			}
		} catch {
			categoriesList = [];
		}
	}

	async function loadTagsList() {
		try {
			const res = await fetch(`${API_BASE}/product-tags?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as { data?: Array<{ id: string; value: string }> };
				tagsList = j.data ?? [];
			} else {
				tagsList = [];
			}
		} catch {
			tagsList = [];
		}
	}

	async function openOrgSheet() {
		if (!product || !product.id) {
			await loadProduct();
			if (!product || !product.id) return;
		}
		orgSheetOpen = true;
		orgCollectionIds = [...(product.collection_ids ?? product.collections?.map((c) => c.id) ?? [])];
		orgCategoryId = product.category_id ?? '';
		orgTagIds = [...(product.tag_ids ?? [])];
		orgError = null;
		loadCollectionsList();
		loadCategoriesList();
		loadTagsList();
	}

	function closeOrgSheet() {
		orgSheetOpen = false;
		orgError = null;
	}

	async function submitOrgSheet() {
		if (!product) return;
		orgError = null;
		orgSubmitting = true;
		try {
			if (orgCategoryId) {
				const res = await fetch(`${API_BASE}/product-categories/${orgCategoryId}/products`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ product_ids: [product.id] })
				});
				if (!res.ok) throw new Error(await res.text());
			} else {
				const res = await fetch(`${API_BASE}/products/${product.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ category_id: '' })
				});
				if (!res.ok) throw new Error(await res.text());
			}
			const orgRes = await fetch(`${API_BASE}/products/${product.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ collection_ids: orgCollectionIds, tag_ids: orgTagIds })
			});
			if (!orgRes.ok) throw new Error(await orgRes.text());
			closeOrgSheet();
			loadProduct();
			loadCategory();
		} catch (e) {
			orgError = e instanceof Error ? e.message : String(e);
		} finally {
			orgSubmitting = false;
		}
	}

	const orgCategoryLabel = $derived(
		orgCategoryId
			? (categoriesList.find((c) => c.id === orgCategoryId)?.value ?? '1 selected')
			: 'None'
	);
	const orgTagLabel = $derived(orgTagIds.length === 0 ? 'None' : `${orgTagIds.length} selected`);
	let orgTagInput = $state('');
	let orgTagDropdownOpen = $state(false);
	let orgTagCreating = $state(false);
	const orgTagFilteredOptions = $derived(
		tagsList.filter(
			(tag) =>
				!orgTagIds.includes(tag.id) &&
				(!orgTagInput.trim() || tag.value.toLowerCase().includes(orgTagInput.trim().toLowerCase()))
		)
	);
	const orgTagShowCreate = $derived(
		orgTagInput.trim().length > 0 &&
		!tagsList.some((t) => t.value.toLowerCase() === orgTagInput.trim().toLowerCase())
	);
	function removeOrgTag(tagId: string) {
		orgTagIds = orgTagIds.filter((id) => id !== tagId);
	}
	function selectOrgTag(tagId: string) {
		if (!orgTagIds.includes(tagId)) orgTagIds = [...orgTagIds, tagId];
		orgTagInput = '';
		orgTagDropdownOpen = false;
	}
	async function createAndSelectOrgTag() {
		const value = orgTagInput.trim();
		if (!value || orgTagCreating) return;
		orgTagCreating = true;
		try {
			const res = await fetch(`${API_BASE}/product-tags`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ value })
			});
			if (!res.ok) throw new Error(await res.text());
			const tag = (await res.json()) as { id: string; value: string };
			tagsList = [...tagsList, { id: tag.id, value: tag.value }];
			selectOrgTag(tag.id);
		} catch {
			// leave input so user can retry
		} finally {
			orgTagCreating = false;
		}
	}
	const orgCollectionLabel = $derived(
		orgCollectionIds.length === 0
			? 'None'
			: `${orgCollectionIds.length} selected`
	);
	function addOrgCollection(collectionId: string) {
		if (!orgCollectionIds.includes(collectionId)) orgCollectionIds = [...orgCollectionIds, collectionId];
	}
	function removeOrgCollection(collectionId: string) {
		orgCollectionIds = orgCollectionIds.filter((id) => id !== collectionId);
	}
	const orgCollectionsAvailableToAdd = $derived(
		collectionsList.filter((c) => !orgCollectionIds.includes(c.id))
	);

	let metadataSheetOpen = $state(false);
	let metadataRows = $state<Array<{ key: string; value: string }>>([]);
	let metadataError = $state<string | null>(null);
	let metadataSubmitting = $state(false);

	const metadataKeysCount = $derived(
		product?.metadata && typeof product.metadata === 'object'
			? Object.keys(product.metadata).length
			: 0
	);

	let jsonSheetOpen = $state(false);
	let variantsEditSheetOpen = $state(false);
	let variantsEditError = $state<string | null>(null);
	let variantsEditSubmitting = $state(false);
	type EditOption = { id: string | null; title: string; values: string[] };
	let editOptions = $state<EditOption[]>([]);
	let variantsEditOptionValueInput = $state<Record<number, string>>({});

	type EditSheetVariantRow = {
		key: string;
		optionTitle: string;
		title: string;
		sku: string;
		manage_inventory: boolean;
		allow_backorder: boolean;
		variantId?: string;
	};
	let editSheetVariantRows = $state<EditSheetVariantRow[]>([]);

	function cartesian<T>(arrays: T[][]): T[][] {
		if (arrays.length === 0) return [[]];
		const [first, ...rest] = arrays;
		const restProduct = cartesian(rest);
		return first.flatMap((item) => restProduct.map((combo) => [item, ...combo]));
	}

	function syncEditSheetVariantRows() {
		const valueArrays = editOptions
			.filter((o) => o.title.trim())
			.map((o) => o.values.filter((v) => v.trim()));
		const hasAllValues =
			valueArrays.length === editOptions.length && valueArrays.every((a) => a.length > 0);
		if (!hasAllValues || editOptions.length === 0) {
			editSheetVariantRows = [];
			return;
		}
		const combinations = cartesian(valueArrays);
		const optionTitles = editOptions.filter((o) => o.title.trim()).map((o) => o.title);
		editSheetVariantRows = combinations.map((combo) => {
			const key = combo.join('|');
			const optionTitle = combo.join(' / ');
			// Try to find matching variant - check both exact match and normalized match
			const variant = variants.find((v) => {
				const normalizedVariantTitle = v.title.trim();
				const normalizedOptionTitle = optionTitle.trim();
				return normalizedVariantTitle === normalizedOptionTitle || 
				       normalizedVariantTitle.toLowerCase() === normalizedOptionTitle.toLowerCase();
			});
			if (variant) {
				return {
					key,
					optionTitle,
					title: variant.title,
					sku: variant.sku ?? '',
					manage_inventory: variant.manage_inventory,
					allow_backorder: variant.allow_backorder ?? false,
					variantId: variant.id
				};
			}
			return {
				key,
				optionTitle,
				title: optionTitle,
				sku: '',
				manage_inventory: false,
				allow_backorder: false
			};
		});
	}

	async function openVariantsEditSheet() {
		if (!product || !product.id) {
			await loadProduct();
			if (!product || !product.id) return;
		}
		await loadOptionsAndVariants();
		
		variantsEditSheetOpen = true;
		variantsEditError = null;
		
		// Extract option values from existing variants
		const optionValuesMap = new Map<string, Set<string>>();
		options.forEach((opt) => {
			optionValuesMap.set(opt.id, new Set<string>());
		});
		
		// Extract values from variants
		if (variants.length > 0) {
			variants.forEach((variant) => {
				if (options.length === 1) {
					// Single option: variant title is the value
					const optId = options[0].id;
					const valueSet = optionValuesMap.get(optId);
					if (valueSet && variant.title.trim()) {
						valueSet.add(variant.title.trim());
					}
				} else if (options.length > 1) {
					// Multiple options: variant title is "Value1 / Value2 / ..."
					const parts = variant.title.split('/').map((p) => p.trim()).filter(Boolean);
					if (parts.length === options.length) {
						options.forEach((opt, index) => {
							const valueSet = optionValuesMap.get(opt.id);
							if (valueSet && parts[index]) {
								valueSet.add(parts[index]);
							}
						});
					}
				}
			});
		}
		
		// Build editOptions with extracted values
		editOptions = options.map((opt) => ({
			id: opt.id,
			title: opt.title,
			values: Array.from(optionValuesMap.get(opt.id) || [])
		}));
		variantsEditOptionValueInput = {};
		editSheetVariantRows = [];
		syncEditSheetVariantRows();
	}

	function addEditOption() {
		editOptions = [...editOptions, { id: null, title: '', values: [] }];
		syncEditSheetVariantRows();
	}

	function removeEditOption(index: number) {
		editOptions = editOptions.filter((_, i) => i !== index);
		syncEditSheetVariantRows();
	}

	function updateEditOptionTitle(index: number, title: string) {
		editOptions = editOptions.map((o, i) => (i === index ? { ...o, title } : o));
	}

	function addEditOptionValue(optionIndex: number, value: string) {
		const v = value.trim();
		if (!v) return;
		editOptions = editOptions.map((o, i) =>
			i === optionIndex ? { ...o, values: [...o.values, v] } : o
		);
		variantsEditOptionValueInput = { ...variantsEditOptionValueInput, [optionIndex]: '' };
		syncEditSheetVariantRows();
	}

	function removeEditOptionValue(optionIndex: number, valueIndex: number) {
		editOptions = editOptions.map((o, i) =>
			i === optionIndex ? { ...o, values: o.values.filter((_, j) => j !== valueIndex) } : o
		);
		syncEditSheetVariantRows();
	}

	function updateEditSheetVariantRow(key: string, updates: Partial<EditSheetVariantRow>) {
		editSheetVariantRows = editSheetVariantRows.map((r) =>
			r.key === key ? { ...r, ...updates } : r
		);
	}

	async function submitVariantsEditSheet() {
		if (!productId || !product) return;
		variantsEditError = null;
		variantsEditSubmitting = true;
		try {
			// 1. Delete variants that are no longer in the grid
			const keptVariantIds = new Set(
				editSheetVariantRows.filter((r) => r.variantId).map((r) => r.variantId!)
			);
			const toDeleteVariantIds = variants.filter((v) => !keptVariantIds.has(v.id)).map((v) => v.id);
			if (toDeleteVariantIds.length > 0) {
				const res = await fetch(`${API_BASE}/product-variants`, {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ variant_ids: toDeleteVariantIds })
				});
				if (!res.ok) throw new Error(await res.text());
			}

			// 2. Update existing variants
			for (const row of editSheetVariantRows) {
				if (!row.variantId) continue;
				const v = variants.find((x) => x.id === row.variantId);
				if (!v) continue;
				const changed =
					v.title !== row.title ||
					(v.sku ?? '') !== row.sku ||
					v.manage_inventory !== row.manage_inventory ||
					(v.allow_backorder ?? false) !== row.allow_backorder;
				if (!changed) continue;
				const res = await fetch(`${API_BASE}/product-variants/${row.variantId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title: row.title,
						sku: row.sku.trim() || null,
						manage_inventory: row.manage_inventory,
						allow_backorder: row.allow_backorder
					})
				});
				if (!res.ok) throw new Error(await res.text());
			}

			// 3. Create new variants
			for (const row of editSheetVariantRows) {
				if (row.variantId) continue;
				const res = await fetch(`${API_BASE}/product-variants`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						title: row.title,
						product_id: productId,
						sku: row.sku.trim() || null,
						manage_inventory: row.manage_inventory,
						allow_backorder: row.allow_backorder
					})
				});
				if (!res.ok) throw new Error(await res.text());
			}

			// 4. Update existing options (title only)
			for (const opt of editOptions) {
				if (!opt.id) continue;
				const existing = options.find((o) => o.id === opt.id);
				if (!existing || existing.title === opt.title.trim()) continue;
				const res = await fetch(`${API_BASE}/product-options/${opt.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: opt.title.trim(), product_id: productId })
				});
				if (!res.ok) throw new Error(await res.text());
			}

			// 5. Create new options
			for (const opt of editOptions) {
				if (opt.id != null || !opt.title.trim() || opt.values.filter((v) => v.trim()).length === 0)
					continue;
				const res = await fetch(`${API_BASE}/product-options`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: opt.title.trim(), product_id: productId })
				});
				if (!res.ok) throw new Error(await res.text());
			}

			// 6. Delete removed options (options that are no longer in editOptions by id)
			const editOptionIds = new Set(editOptions.map((o) => o.id).filter(Boolean) as string[]);
			const toDeleteOptionIds = options.filter((o) => !editOptionIds.has(o.id)).map((o) => o.id);
			if (toDeleteOptionIds.length > 0) {
				const res = await fetch(`${API_BASE}/product-options`, {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ option_ids: toDeleteOptionIds })
				});
				if (!res.ok) throw new Error(await res.text());
			}

			variantsEditSheetOpen = false;
			loadOptionsAndVariants();
		} catch (e) {
			variantsEditError = e instanceof Error ? e.message : String(e);
		} finally {
			variantsEditSubmitting = false;
		}
	}

	// Edit single variant sheet
	let editVariantSheetOpen = $state(false);
	let editingVariant = $state<ProductVariant | null>(null);
	let editVariantAttributes = $state<Array<{ id: string; title: string; type: string; value: string }>>([]);
	let editVariantTitle = $state('');
	let editVariantMaterial = $state('');
	let editVariantSku = $state('');
	let editVariantEan = $state('');
	let editVariantUpc = $state('');
	let editVariantBarcode = $state('');
	let editVariantManageInventory = $state(false);
	let editVariantAllowBackorder = $state(false);
	let editVariantError = $state<string | null>(null);
	let editVariantSubmitting = $state(false);
	let editVariantAddAttributeId = $state('');

	async function openEditVariantSheet(v: ProductVariant) {
		editingVariant = v;
		editVariantTitle = v.title;
		editVariantMaterial = '';
		editVariantSku = v.sku ?? '';
		editVariantEan = v.ean ?? '';
		editVariantUpc = v.upc ?? '';
		editVariantBarcode = v.barcode ?? '';
		editVariantManageInventory = v.manage_inventory;
		editVariantAllowBackorder = v.allow_backorder ?? false;
		editVariantError = null;
		editVariantAttributes = [];
		editVariantAddAttributeId = '';
		editVariantSheetOpen = true;
		loadAvailableAttributes();
		try {
			const res = await fetch(`${API_BASE}/product-variants/${v.id}`, { cache: 'no-store' });
			if (res.ok) {
				const data = await res.json();
				editVariantAttributes = data.attributes ?? [];
			} else {
				editVariantAttributes = (product?.attributes ?? []).map((a) => ({ ...a, value: a.value ?? '' }));
			}
		} catch {
			editVariantAttributes = (product?.attributes ?? []).map((a) => ({ ...a, value: a.value ?? '' }));
		}
	}

	function addEditVariantAttribute() {
		if (!editVariantAddAttributeId) return;
		const att = availableAttributesList.find((a) => a.id === editVariantAddAttributeId);
		if (!att || editVariantAttributes.some((a) => a.id === att.id)) return;
		editVariantAttributes = [...editVariantAttributes, { id: att.id, title: att.title, type: att.type, value: '' }];
		editVariantAddAttributeId = '';
	}

	function removeEditVariantAttribute(attributeId: string) {
		editVariantAttributes = editVariantAttributes.filter((a) => a.id !== attributeId);
	}

	function closeEditVariantSheet() {
		editVariantSheetOpen = false;
		editingVariant = null;
		editVariantAttributes = [];
		editVariantError = null;
	}

	async function submitEditVariant() {
		if (!editingVariant) return;
		editVariantError = null;
		editVariantSubmitting = true;
		try {
			const body: Record<string, unknown> = {
				title: editVariantTitle.trim() || editingVariant.title,
				product_id: editingVariant.product_id ?? undefined,
				sku: editVariantSku.trim() || null,
				ean: editVariantEan.trim() || null,
				upc: editVariantUpc.trim() || null,
				barcode: editVariantBarcode.trim() || null,
				manage_inventory: editVariantManageInventory,
				allow_backorder: editVariantAllowBackorder
			};
			if (editVariantMaterial.trim()) {
				body.metadata = { material: editVariantMaterial.trim() };
			}
			body.attribute_values = editVariantAttributes.map((a) => ({
				attribute_id: a.id,
				value: a.value ?? ''
			}));
			const res = await fetch(`${API_BASE}/product-variants/${editingVariant.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEditVariantSheet();
			loadOptionsAndVariants();
		} catch (e) {
			editVariantError = e instanceof Error ? e.message : String(e);
		} finally {
			editVariantSubmitting = false;
		}
	}

	async function deleteVariant(v: ProductVariant) {
		try {
			const res = await fetch(`${API_BASE}/product-variants`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ variant_ids: [v.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			loadOptionsAndVariants();
		} catch {
			// ignore for now
		}
	}

	const productJsonForView = $derived.by(() => {
		if (!product) return null;
		return {
			...product,
			options,
			variants,
			category
		};
	});
	const jsonKeysCount = $derived(productJsonForView ? Object.keys(productJsonForView).length : 0);

	function openMetadataSheet() {
		if (!product) return;
		const meta =
			product.metadata && typeof product.metadata === 'object'
				? (product.metadata as Record<string, unknown>)
				: {};
		metadataRows = Object.entries(meta).map(([k, v]) => ({ key: k, value: String(v ?? '') }));
		if (metadataRows.length === 0) metadataRows = [{ key: '', value: '' }];
		metadataSheetOpen = true;
		metadataError = null;
	}

	function closeMetadataSheet() {
		metadataSheetOpen = false;
		metadataError = null;
	}

	function addMetadataRow() {
		metadataRows = [...metadataRows, { key: '', value: '' }];
	}

	function removeMetadataRow(index: number) {
		metadataRows = metadataRows.filter((_, i) => i !== index);
	}

	async function submitMetadata() {
		if (!product) return;
		metadataError = null;
		metadataSubmitting = true;
		try {
			const meta: Record<string, string | number> = {};
			for (const row of metadataRows) {
				const k = row.key.trim();
				if (!k) continue;
				const num = Number(row.value);
				meta[k] = Number.isNaN(num) ? row.value : num;
			}
			const res = await fetch(`${API_BASE}/products/${product.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ metadata: meta })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeMetadataSheet();
			loadProduct();
		} catch (e) {
			metadataError = e instanceof Error ? e.message : String(e);
		} finally {
			metadataSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{product ? `${product.title} | Product` : 'Product'} | Danimai Store</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Breadcrumb + actions -->
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4">
		<nav class="flex items-center gap-2 text-sm">
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground"
				onclick={() => goto('/products')}
			>
				Products
			</button>
			<span class="text-muted-foreground">/</span>
			<span class="font-medium">{product?.title ?? productId ?? '…'}</span>
		</nav>
		<Button variant="ghost" size="icon" class="size-9">
			<Bell class="size-4" />
			<span class="sr-only">Notifications</span>
		</Button>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !product}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Product not found'}</p>
			<Button variant="outline" onclick={() => goto('/products')}>Back to products</Button>
		</div>
	{:else}
		<div class="flex-1 overflow-auto p-6">
			<div class="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
				<!-- Left / center column -->
				<div class="flex flex-col gap-6 lg:col-span-2">
					<!-- General card -->
					<div class="rounded-lg border bg-card p-6">
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<h1 class="truncate text-xl font-semibold">{product.title}</h1>
									<span
										class={cn(
											'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
											product.status === 'published' &&
												'bg-green-500/10 text-green-700 dark:text-green-400',
											product.status === 'draft' && 'bg-muted text-muted-foreground',
											product.status === 'proposed' &&
												'bg-amber-500/10 text-amber-700 dark:text-amber-400',
											product.status === 'rejected' && 'bg-destructive/10 text-destructive'
										)}
									>
										<span
											class="size-1.5 shrink-0 rounded-sm bg-current opacity-70"
											aria-hidden="true"
										></span>
										{product.status}
									</span>
								</div>
							</div>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
								>
									<MoreHorizontal class="size-4" />
									<span class="sr-only">Actions</span>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
									>
										<DropdownMenu.Item
											textValue="Edit"
											class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={openEditSheet}
										>
											<Pencil class="size-4" />
											Edit
										</DropdownMenu.Item>
										<DropdownMenu.Item
											textValue="Delete"
											class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={() => {}}
										>
											<Trash2 class="size-4" />
											Delete
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>
						<dl class="mt-4 grid gap-3 text-sm">
							<div class="flex justify-between gap-4">
								<dt class="shrink-0 font-medium text-muted-foreground">Description</dt>
								<dd class="text-right">{product.description || '—'}</dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt class="shrink-0 font-medium text-muted-foreground">Subtitle</dt>
								<dd class="text-right">{product.subtitle || '—'}</dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt class="shrink-0 font-medium text-muted-foreground">Handle</dt>
								<dd class="text-right">{handleDisplay}</dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt class="shrink-0 font-medium text-muted-foreground">Discountable</dt>
								<dd class="text-right">
									{product.discountable === true
										? 'True'
										: product.discountable === false
											? 'False'
											: '—'}
								</dd>
							</div>
						</dl>
					</div>

					<!-- Media card -->
					<div class="rounded-lg border bg-card p-6">
						<div class="flex items-center justify-between">
							<h2 class="font-semibold">Media</h2>
							<Button variant="ghost" size="icon" class="size-8">
								<MoreHorizontal class="size-4" />
								<span class="sr-only">Actions</span>
							</Button>
						</div>
						<div
							class="mt-4 flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30 py-8 text-center text-sm text-muted-foreground"
						>
							<Upload class="size-8" />
							<p>No media yet</p>
							<p class="text-xs">Add media to the product to showcase it in your storefront.</p>
							<Button variant="outline" size="sm" class="mt-2">Add media</Button>
						</div>
					</div>

					<!-- Options & Variants card (merged) -->
					<div class="rounded-lg border bg-card p-6">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<h2 class="font-semibold">Options & Variants</h2>
							<div class="flex items-center gap-2">
								<Button variant="outline" size="icon" class="size-8">
									<Search class="size-4" />
									<span class="sr-only">Sort</span>
								</Button>
								<Input placeholder="Search" class="h-8 w-32" />
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
									>
										<MoreHorizontal class="size-4" />
										<span class="sr-only">Actions</span>
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content
											class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
											sideOffset={4}
										>
											<DropdownMenu.Item
												textValue="Edit"
												class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
												onSelect={openVariantsEditSheet}
											>
												<Pencil class="size-4" />
												Edit
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							</div>
						</div>

						<!-- Options section -->
						{#if options.length === 0}
							<p class="mt-4 text-sm text-muted-foreground">No options defined.</p>
						{:else}
							<div class="mt-4 flex flex-col gap-4">
								{#each options as opt (opt.id)}
									<div>
										<p class="text-sm font-medium text-muted-foreground">{opt.title}</p>
										<div class="mt-1.5 flex flex-wrap gap-1.5">
											{#if optionValues.length > 0 && options.length === 1}
												{#each optionValues as val (val)}
													<span
														class="inline-flex items-center rounded-md border bg-muted/50 px-2.5 py-1 text-sm"
													>
														{val}
													</span>
												{/each}
											{:else}
												<span class="text-sm text-muted-foreground">—</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Variants section -->
						<div class="mt-4 overflow-hidden rounded-md border">
							<table class="w-full text-sm">
								<thead class="border-b bg-muted/50">
									<tr>
										<th class="px-4 py-3 text-left font-medium">Title</th>
										<th class="px-4 py-3 text-left font-medium">SKU</th>
										{#if options.length === 1}
											<th class="px-4 py-3 text-left font-medium"
												>{options[0]?.title ?? 'Option'}</th
											>
										{/if}
										<th class="px-4 py-3 text-left font-medium">Inventory</th>
										<th class="px-4 py-3 text-left font-medium">Created</th>
										<th class="px-4 py-3 text-left font-medium">Updated</th>
										<th class="w-10 px-4 py-3"></th>
									</tr>
								</thead>
								<tbody>
									{#if paginatedVariants.length === 0}
										<tr>
											<td
												colspan={options.length === 1 ? 7 : 6}
												class="px-4 py-8 text-center text-muted-foreground"
											>
												No variants.
											</td>
										</tr>
									{:else}
										{#each paginatedVariants as v (v.id)}
											<tr class="border-b last:border-0">
												<td class="px-4 py-3 font-medium">{v.title}</td>
												<td class="px-4 py-3 text-muted-foreground">{v.sku || '—'}</td>
												{#if options.length === 1}
													<td class="px-4 py-3">{v.title}</td>
												{/if}
												<td class="px-4 py-3 text-muted-foreground">
													{v.manage_inventory ? 'Managed' : 'Not managed'}
												</td>
												<td class="px-4 py-3 text-muted-foreground">{formatDate(v.created_at)}</td>
												<td class="px-4 py-3 text-muted-foreground">{formatDate(v.updated_at)}</td>
												<td class="px-4 py-3">
													<DropdownMenu.Root>
														<DropdownMenu.Trigger
															class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
														>
															<MoreHorizontal class="size-4" />
															<span class="sr-only">Actions</span>
														</DropdownMenu.Trigger>
														<DropdownMenu.Portal>
															<DropdownMenu.Content
																class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
																sideOffset={4}
															>
																<DropdownMenu.Item
																	textValue="Edit"
																	class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
																	onSelect={() => openEditVariantSheet(v)}
																>
																	<Pencil class="size-4" />
																	Edit
																</DropdownMenu.Item>
																<DropdownMenu.Item
																	textValue="Delete"
																	class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
																	onSelect={() => deleteVariant(v)}
																>
																	<Trash2 class="size-4" />
																	Delete
																</DropdownMenu.Item>
															</DropdownMenu.Content>
														</DropdownMenu.Portal>
													</DropdownMenu.Root>
												</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
						{#if variantTotal > 0}
							<div class="mt-4 flex items-center justify-between border-t pt-4">
								<p class="text-sm text-muted-foreground">
									{variantStart} – {variantEnd} of {variantTotal} results
								</p>
								<div class="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={variantPage <= 1}
										onclick={() => (variantPage = Math.max(1, variantPage - 1))}
									>
										Prev
									</Button>
									<span class="text-sm text-muted-foreground">
										{variantPage} of {variantTotalPages} pages
									</span>
									<Button
										variant="outline"
										size="sm"
										disabled={variantPage >= variantTotalPages}
										onclick={() => (variantPage = Math.min(variantTotalPages, variantPage + 1))}
									>
										Next
									</Button>
								</div>
							</div>
						{/if}
					</div>

					<!-- Metadata / JSON placeholders -->
					<div class="flex gap-4">
						<div class="flex-1 rounded-lg border bg-card p-4">
							<div class="flex items-center justify-between gap-2">
								<h3 class="font-medium">Metadata</h3>
								<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
									{metadataKeysCount} keys
								</span>
								<Button
									variant="ghost"
									size="icon"
									class="size-8 shrink-0"
									onclick={openMetadataSheet}
								>
									<ExternalLink class="size-4" />
									<span class="sr-only">Edit metadata</span>
								</Button>
							</div>
						</div>
						<div class="flex-1 rounded-lg border bg-card p-4">
							<div class="flex items-center justify-between gap-2">
								<h3 class="font-medium">JSON</h3>
								<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
									{jsonKeysCount} keys
								</span>
								<Button
									variant="ghost"
									size="icon"
									class="size-8 shrink-0"
									onclick={() => (jsonSheetOpen = true)}
								>
									<ExternalLink class="size-4" />
									<span class="sr-only">View JSON</span>
								</Button>
							</div>
						</div>
					</div>
				</div>

				<!-- Right column -->
				<div class="flex flex-col gap-6">
					<!-- Sales Channels -->
					<div class="rounded-lg border bg-card p-6">
						<div class="flex items-center justify-between">
							<h2 class="font-semibold">Sales Channels</h2>
							<Button
								variant="ghost"
								size="icon"
								class="size-8"
								onclick={() => {
									salesChannelsSheetOpen = true;
									fetchSalesChannels();
								}}
							>
								<SlidersHorizontal class="size-4" />
								<span class="sr-only">Manage sales channels</span>
							</Button>
						</div>
						<div class="mt-4 flex flex-col gap-2">
							{#if productSalesChannelIds.size > 0}
								{#each Array.from(productSalesChannelIds).map((id) => {
									const channel = allSalesChannels.find((ch) => ch.id === id);
									return channel;
								}).filter(Boolean) as channel}
									<div class="flex items-center gap-2 text-sm">
										<Share2 class="size-4 text-muted-foreground" />
										<span>{channel.name}</span>
									</div>
								{/each}
							{:else}
								<div class="flex items-center gap-2 text-sm">
									<Share2 class="size-4 text-muted-foreground" />
									<span>No sales channels selected</span>
								</div>
							{/if}
						</div>
						<p class="mt-1 text-xs text-muted-foreground">
							Available in {productSalesChannelIds.size} of {allSalesChannels.length} sales channels
						</p>
					</div>

					<!-- Shipping configuration -->
					<div class="rounded-lg border bg-card p-6">
						<div class="flex items-center justify-between">
							<h2 class="font-semibold">Shipping configuration</h2>
							<Button variant="ghost" size="icon" class="size-8">
								<MoreHorizontal class="size-4" />
								<span class="sr-only">Actions</span>
							</Button>
						</div>
						<button
							type="button"
							class="mt-4 flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm hover:bg-muted/50"
						>
							<Lock class="size-4 text-muted-foreground" />
							<div>
								<p class="font-medium">Default Shipping Profile</p>
								<p class="text-xs text-muted-foreground">default</p>
							</div>
							<span class="ml-auto text-muted-foreground">→</span>
						</button>
					</div>

					<!-- Organize -->
					<div class="rounded-lg border bg-card p-6">
						<div class="flex items-center justify-between">
							<h2 class="font-semibold">Organize</h2>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
								>
									<MoreHorizontal class="size-4" />
									<span class="sr-only">Actions</span>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
									>
										<DropdownMenu.Item
											textValue="Edit"
											class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={openOrgSheet}
										>
											<Pencil class="size-4" />
											Edit
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>
						<dl class="mt-4 space-y-3 text-sm">
							<div>
								<dt class="font-medium text-muted-foreground">Collections</dt>
								<dd>
									{#if product.collections && product.collections.length > 0}
										<span class="inline-flex flex-wrap gap-1">
											{#each product.collections as col (col.id)}
												<span
													class="inline-flex items-center rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
												>
													{col.title}
												</span>
											{/each}
										</span>
									{:else}
										—
									{/if}
								</dd>
							</div>
							<div>
								<dt class="font-medium text-muted-foreground">Categories</dt>
								<dd>
									{#if category}
										<span
											class="inline-flex items-center rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
										>
											{category.value}
										</span>
									{:else}
										—
									{/if}
								</dd>
							</div>
							<div>
								<dt class="font-medium text-muted-foreground">Tags</dt>
								<dd>
									{#if product.tags && product.tags.length > 0}
										<span class="inline-flex flex-wrap gap-1">
											{#each product.tags as tag (tag.id)}
												<span
													class="inline-flex items-center rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
												>
													{tag.value}
												</span>
											{/each}
										</span>
									{:else if product.tag_ids && product.tag_ids.length > 0 && tagsList.length > 0}
										<span class="inline-flex flex-wrap gap-1">
											{#each product.tag_ids as tagId (tagId)}
												{@const tag = tagsList.find((t) => t.id === tagId)}
												{#if tag}
													<span
														class="inline-flex items-center rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
													>
														{tag.value}
													</span>
												{/if}
											{/each}
										</span>
									{:else}
										—
									{/if}
								</dd>
							</div>
						</dl>
					</div>

					<!-- Attributes -->
					<div class="rounded-lg border bg-card p-6">
						<div class="flex items-center justify-between">
							<h2 class="font-semibold">Attributes</h2>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
								>
									<MoreHorizontal class="size-4" />
									<span class="sr-only">Actions</span>
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
									>
										<DropdownMenu.Item
											textValue="Edit"
											class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
											onSelect={openEditAttributesSheet}
										>
											<Pencil class="size-4" />
											Edit
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>
						<dl class="mt-4 space-y-3 text-sm">
							{#if product?.attributes && product.attributes.length > 0}
								{#each product.attributes as attr (attr.id)}
									<div>
										<dt class="font-medium text-muted-foreground">{attr.title}</dt>
										<dd class="break-words text-foreground">{attr.value}</dd>
									</div>
								{/each}
							{:else}
								<div>
									<dt class="font-medium text-muted-foreground">No attributes</dt>
									<dd>—</dd>
								</div>
							{/if}
						</dl>
					</div>
				</div>
			</div>
		</div>

		<!-- Edit Product sheet -->
		<Sheet.Root bind:open={editSheetOpen}>
			<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right">
				<Sheet.Header class="flex flex-col items-center gap-1.5 text-center sm:text-center">
					<Sheet.Title>Edit Product</Sheet.Title>
				</Sheet.Header>
				<div class="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
					<div class="flex flex-col gap-2">
						<label for="edit-status" class="text-sm font-medium">Status</label>
						<select
							id="edit-status"
							bind:value={editStatus}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="draft">Draft</option>
							<option value="proposed">Proposed</option>
							<option value="published">Published</option>
							<option value="rejected">Rejected</option>
						</select>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>
						<Input id="edit-title" bind:value={editTitle} class="h-9" />
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-subtitle" class="text-sm font-medium">
							Subtitle <span class="font-normal text-muted-foreground">(Optional)</span>
						</label>
						<Input id="edit-subtitle" bind:value={editSubtitle} class="h-9" />
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-handle" class="text-sm font-medium">Handle</label>
						<div class="relative flex w-full items-center">
							<span class="absolute start-3 text-sm text-muted-foreground">/</span>
							<Input
								id="edit-handle"
								bind:value={editHandle}
								class="h-9 pl-6"
								placeholder="product-handle"
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Attributes</span>
						<div class="space-y-2">
							{#each editProductAttributesList as row, i (row.attribute_id + i)}
								<div class="flex items-center gap-2 rounded-md border p-2">
									<div class="min-w-0 flex-1">
										<span class="text-sm font-medium text-muted-foreground">{row.title}</span>
										<Input bind:value={row.value} class="mt-1 h-9" placeholder="Value" />
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										class="size-8 shrink-0"
										aria-label="Remove attribute"
										onclick={() => removeEditProductAttribute(i)}
									>
										<Trash2 class="size-4" />
									</Button>
								</div>
							{/each}
							{#if editProductAttributesAvailableToAdd.length > 0}
								<div class="flex flex-wrap items-end gap-2 rounded-md border border-dashed p-2">
									<select
										bind:value={editProductAddAttributeId}
										class="flex h-9 min-w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
									>
										<option value="">Add attribute…</option>
										{#each editProductAttributesAvailableToAdd as att (att.id)}
											<option value={att.id}>{att.title}</option>
										{/each}
									</select>
									<Input
										bind:value={editProductAddAttributeValue}
										class="h-9 min-w-24 flex-1"
										placeholder="Value"
									/>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										onclick={addEditProductAttribute}
										disabled={!editProductAddAttributeId}
									>
										Add
									</Button>
								</div>
							{/if}
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-description" class="text-sm font-medium">
							Description <span class="font-normal text-muted-foreground">(Optional)</span>
						</label>
						<textarea
							id="edit-description"
							bind:value={editDescription}
							rows="3"
							class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
						></textarea>
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-2">
							<button
								id="edit-discountable"
								type="button"
								role="switch"
								aria-checked={editDiscountable}
								aria-label="Discountable"
								class={cn(
									'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
									editDiscountable ? 'bg-primary' : 'bg-input'
								)}
								onclick={() => (editDiscountable = !editDiscountable)}
							>
								<span
									class={cn(
										'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
										editDiscountable ? 'translate-x-5' : 'translate-x-[1px]'
									)}
								></span>
							</button>
							<label for="edit-discountable" class="text-sm font-medium">Discountable</label>
						</div>
						<p class="text-xs text-muted-foreground">
							When unchecked, discounts will not be applied to this product.
						</p>
					</div>
					{#if editError}
						<p class="text-sm text-destructive">{editError}</p>
					{/if}
				</div>
				<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
					<Button variant="outline" onclick={closeEditSheet} disabled={editSubmitting}>
						Cancel
					</Button>
					<Button onclick={submitEditProduct} disabled={editSubmitting}>
						{editSubmitting ? 'Saving…' : 'Save'}
					</Button>
				</Sheet.Footer>
			</Sheet.Content>
		</Sheet.Root>

		<!-- Edit Attributes sheet -->
		<Sheet.Root bind:open={editAttributesSheetOpen}>
			<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right">
				<Sheet.Header class="flex flex-col items-center gap-1.5 text-center sm:text-center">
					<Sheet.Title>Edit Attributes</Sheet.Title>
				</Sheet.Header>
				<div class="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
					<div class="space-y-3">
						{#each editAttributesList as row, i (row.attribute_id + i)}
							<div class="flex items-center gap-2 rounded-md border p-2">
								<div class="min-w-0 flex-1">
									<span class="text-sm font-medium text-muted-foreground">{row.title}</span>
									<Input
										bind:value={row.value}
										class="mt-1 h-9"
										placeholder="Value"
									/>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="size-8 shrink-0"
									aria-label="Remove attribute"
									onclick={() => removeAttributeFromEdit(i)}
								>
									<Trash2 class="size-4" />
								</Button>
							</div>
						{/each}
					</div>
					{#if attributesAvailableToAdd.length > 0}
						<div class="flex flex-col gap-2 rounded-md border border-dashed p-3">
							<span class="text-sm font-medium">Add attribute</span>
							<div class="flex flex-wrap items-end gap-2">
								<select
									bind:value={addAttributeId}
									class="flex h-9 min-w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<option value="">Select…</option>
									{#each attributesAvailableToAdd as att (att.id)}
										<option value={att.id}>{att.title}</option>
									{/each}
								</select>
								<Input
									bind:value={addAttributeValue}
									class="h-9 flex-1 min-w-24"
									placeholder="Value"
								/>
								<Button type="button" variant="secondary" size="sm" onclick={addAttributeToEdit} disabled={!addAttributeId}>
									Add
								</Button>
							</div>
						</div>
					{/if}
					{#if editAttributesError}
						<p class="text-sm text-destructive">{editAttributesError}</p>
					{/if}
				</div>
				<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
					<Button variant="outline" onclick={closeEditAttributesSheet} disabled={editAttributesSubmitting}>
						Cancel
					</Button>
					<Button onclick={submitEditAttributes} disabled={editAttributesSubmitting}>
						{editAttributesSubmitting ? 'Saving…' : 'Save'}
					</Button>
				</Sheet.Footer>
			</Sheet.Content>
		</Sheet.Root>

		<!-- Edit Organization sheet -->
		<Sheet.Root bind:open={orgSheetOpen}>
			<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right">
				<Sheet.Header class="flex flex-col items-center gap-1.5 text-center sm:text-center">
					<Sheet.Title>Edit Organization</Sheet.Title>
				</Sheet.Header>
				<div class="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
					<div class="flex flex-col gap-2">
						<label for="org-collections" class="text-sm font-medium">
							Collections <span class="font-normal text-muted-foreground">(Optional)</span>
						</label>
						<div class="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5">
							{#each orgCollectionIds as colId (colId)}
								{@const col = collectionsList.find((c) => c.id === colId)}
								{#if col}
									<span
										class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
									>
										{col.title}
										<button
											type="button"
											class="rounded p-0.5 hover:bg-muted-foreground/20"
											aria-label="Remove collection"
											onclick={() => removeOrgCollection(colId)}
										>
											<X class="size-3" />
										</button>
									</span>
								{/if}
							{/each}
							{#if orgCollectionsAvailableToAdd.length > 0}
								<select
									id="org-collections"
									class="h-7 min-w-24 flex-1 rounded border-0 bg-transparent px-1 text-sm outline-none"
									onchange={(e) => {
										const id = e.currentTarget.value;
										if (id) {
											addOrgCollection(id);
											e.currentTarget.value = '';
										}
									}}
								>
									<option value="">Add collection…</option>
									{#each orgCollectionsAvailableToAdd as col (col.id)}
										<option value={col.id}>{col.title}</option>
									{/each}
								</select>
							{/if}
						</div>
						<p class="text-xs text-muted-foreground">{orgCollectionLabel}</p>
					</div>
					<div class="flex flex-col gap-2">
						<label for="org-categories" class="text-sm font-medium">
							Categories <span class="font-normal text-muted-foreground">(Optional)</span>
						</label>
						<select
							id="org-categories"
							bind:value={orgCategoryId}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="">None</option>
							{#each categoriesList as cat (cat.id)}
								<option value={cat.id}>{cat.value}</option>
							{/each}
						</select>
					</div>
					<div class="flex flex-col gap-2">
						<label for="org-tags-input" class="text-sm font-medium">
							Tags <span class="font-normal text-muted-foreground">(Optional)</span>
						</label>
						<div
							class="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-xs outline-none focus-within:ring-2 focus-within:ring-ring"
							role="combobox"
							aria-expanded={orgTagDropdownOpen}
							aria-haspopup="listbox"
							aria-controls="org-tags-listbox"
							id="org-tags"
							onfocusout={(e) => {
								if (!e.currentTarget.contains(e.relatedTarget as Node | null)) orgTagDropdownOpen = false;
							}}
						>
							{#each orgTagIds as tagId (tagId)}
								{@const tag = tagsList.find((t) => t.id === tagId)}
								{#if tag}
									<span
										class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
									>
										{tag.value}
										<button
											type="button"
											class="rounded p-0.5 hover:bg-muted-foreground/20"
											aria-label="Remove tag"
											onclick={() => removeOrgTag(tagId)}
										>
											<X class="size-3" />
										</button>
									</span>
								{/if}
							{/each}
							<div class="relative flex-1 min-w-24">
								<input
									id="org-tags-input"
									type="text"
									class="flex h-7 min-w-0 flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
									placeholder="Type to search or create…"
									bind:value={orgTagInput}
									onfocus={() => (orgTagDropdownOpen = true)}
									onkeydown={(e) => {
										if (e.key === 'Escape') {
											orgTagDropdownOpen = false;
											orgTagInput = '';
										}
										if (e.key === 'Enter' && orgTagDropdownOpen) {
											e.preventDefault();
											if (orgTagShowCreate) createAndSelectOrgTag();
											else if (orgTagFilteredOptions.length > 0) selectOrgTag(orgTagFilteredOptions[0].id);
										}
									}}
								/>
								{#if orgTagDropdownOpen}
									<ul
										id="org-tags-listbox"
										class="absolute top-full left-0 z-50 mt-1 max-h-48 w-full min-w-[12rem] overflow-auto rounded-md border border-input bg-popover py-1 text-popover-foreground shadow-md"
										role="listbox"
									>
										{#each orgTagFilteredOptions as tag (tag.id)}
											<li role="option" aria-selected="false">
												<button
													type="button"
													class="w-full cursor-pointer px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
													onclick={() => selectOrgTag(tag.id)}
													onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), selectOrgTag(tag.id))}
												>
													{tag.value}
												</button>
											</li>
										{/each}
										{#if orgTagShowCreate}
											<li role="option" aria-selected="false">
												<button
													type="button"
													class="w-full cursor-pointer px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
													disabled={orgTagCreating}
													onclick={() => createAndSelectOrgTag()}
													onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), createAndSelectOrgTag())}
												>
													{orgTagCreating ? 'Creating…' : `Create "${orgTagInput.trim()}"`}
												</button>
											</li>
										{/if}
										{#if !orgTagFilteredOptions.length && !orgTagShowCreate && orgTagInput.trim()}
											<li class="px-3 py-1.5 text-sm text-muted-foreground">No tags found</li>
										{/if}
									</ul>
								{/if}
							</div>
						</div>
						<p class="text-xs text-muted-foreground">{orgTagLabel}</p>
					</div>
					{#if orgError}
						<p class="text-sm text-destructive">{orgError}</p>
					{/if}
				</div>
				<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
					<Button variant="outline" onclick={closeOrgSheet} disabled={orgSubmitting}>Cancel</Button>
					<Button onclick={submitOrgSheet} disabled={orgSubmitting}>
						{orgSubmitting ? 'Saving…' : 'Save'}
					</Button>
				</Sheet.Footer>
			</Sheet.Content>
		</Sheet.Root>

		<!-- Edit Metadata sheet -->
		<Sheet.Root bind:open={metadataSheetOpen}>
			<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
				<div class="flex h-full flex-col">
					<div class="flex-1 overflow-auto p-6 pt-12">
						<div class="flex flex-col gap-6">
							<h2 class="text-lg font-semibold">Edit Metadata</h2>

							{#if metadataError}
								<div
									class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
								>
									{metadataError}
								</div>
							{/if}

							<div class="overflow-hidden rounded-md border">
								<table class="w-full text-sm">
									<thead class="border-b bg-muted/50">
										<tr>
											<th class="px-4 py-3 text-left font-medium">Key</th>
											<th class="px-4 py-3 text-left font-medium">Value</th>
											<th class="w-10 px-4 py-3"></th>
										</tr>
									</thead>
									<tbody>
										{#each metadataRows as row, i}
											<tr class="border-b last:border-0">
												<td class="px-4 py-2">
													<Input bind:value={row.key} placeholder="Key" class="h-9 w-full" />
												</td>
												<td class="px-4 py-2">
													<Input bind:value={row.value} placeholder="Value" class="h-9 w-full" />
												</td>
												<td class="px-4 py-2">
													<Button
														variant="ghost"
														size="icon"
														class="size-8 shrink-0 text-destructive hover:bg-destructive/10"
														onclick={() => removeMetadataRow(i)}
														aria-label="Remove row"
													>
														<Trash2 class="size-4" />
													</Button>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
							<Button variant="outline" size="sm" onclick={addMetadataRow}>Add row</Button>
						</div>
					</div>
					<div class="flex justify-end gap-2 border-t p-4">
						<Button variant="outline" onclick={closeMetadataSheet}>Cancel</Button>
						<Button onclick={submitMetadata} disabled={metadataSubmitting}>
							{metadataSubmitting ? 'Saving…' : 'Save'}
						</Button>
					</div>
				</div>
			</Sheet.Content>
		</Sheet.Root>

		<!-- JSON view sheet -->
		<Sheet.Root bind:open={jsonSheetOpen}>
			<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
				<div class="flex h-full flex-col">
					<div class="shrink-0 border-b px-6 py-4">
						<h2 class="text-lg font-semibold">JSON {jsonKeysCount} keys</h2>
					</div>
					<div class="min-h-0 flex-1 overflow-auto p-6">
						{#if productJsonForView}
							<pre
								class="rounded-md border bg-zinc-900 p-4 font-mono text-sm break-all whitespace-pre-wrap text-zinc-300"><code
									>{JSON.stringify(productJsonForView, null, 2)}</code
								></pre>
						{:else}
							<p class="text-sm text-muted-foreground">No data</p>
						{/if}
					</div>
				</div>
			</Sheet.Content>
		</Sheet.Root>

		<!-- Variants edit sheet -->
		<Sheet.Root bind:open={variantsEditSheetOpen}>
			<Sheet.Content side="right" class="w-full max-w-3xl sm:max-w-3xl">
				<div class="flex h-full flex-col">
					<div class="flex-1 overflow-auto p-6 pt-12">
						<h2 class="text-lg font-semibold">Variants</h2>
						<p class="mt-1 text-sm text-muted-foreground">
							Define options and variant details. This ranking will affect the variants' order in
							your storefront.
						</p>

						<!-- Product options -->
						<div class="mt-6">
							<div class="flex items-center justify-between">
								<div>
									<h3 class="text-sm font-medium">Product options</h3>
									<p class="text-xs text-muted-foreground">
										Define the options for the product, e.g. color, size, etc.
									</p>
								</div>
								<Button type="button" variant="outline" size="sm" onclick={addEditOption}
									>Add</Button
								>
							</div>
							{#if editOptions.length === 0}
								<p class="mt-4 text-sm text-muted-foreground">No options defined.</p>
							{:else}
								<div class="mt-4 flex flex-col gap-4">
									{#each editOptions as opt, optIndex (opt.id ?? `new-${optIndex}`)}
										<div class="flex flex-col gap-2 rounded-md border p-3">
											<div class="flex items-center gap-2">
												<Input
													value={opt.title}
													oninput={(e) =>
														updateEditOptionTitle(
															optIndex,
															(e.currentTarget as HTMLInputElement).value
														)}
													placeholder="Title (e.g. Size)"
													class="h-8 flex-1"
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													class="size-8 shrink-0 text-destructive hover:bg-destructive/10"
													onclick={() => removeEditOption(optIndex)}
													aria-label="Remove option"
												>
													<X class="size-4" />
												</Button>
											</div>
											<div class="flex flex-wrap items-center gap-1.5">
												{#each opt.values as val, valIndex (valIndex)}
													<span
														class="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-sm"
													>
														{val}
														<button
															type="button"
															class="rounded p-0.5 hover:bg-muted"
															onclick={() => removeEditOptionValue(optIndex, valIndex)}
															aria-label="Remove value"
														>
															<X class="size-3" />
														</button>
													</span>
												{/each}
												<Input
													placeholder="Add value"
													class="h-7 w-24"
													value={variantsEditOptionValueInput[optIndex] ?? ''}
													oninput={(e) => {
														variantsEditOptionValueInput = {
															...variantsEditOptionValueInput,
															[optIndex]: (e.currentTarget as HTMLInputElement).value
														};
													}}
													onkeydown={(e) => {
														if (e.key === 'Enter') {
															e.preventDefault();
															const v = (e.currentTarget as HTMLInputElement).value;
															addEditOptionValue(optIndex, v);
														}
													}}
												/>
												<Button
													type="button"
													variant="outline"
													size="sm"
													class="h-7"
													onclick={() => {
														const v = variantsEditOptionValueInput[optIndex] ?? '';
														addEditOptionValue(optIndex, v);
													}}
												>
													Add value
												</Button>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Product variants table -->
						<div class="mt-6">
							<h3 class="text-sm font-medium">Product variants</h3>
							<p class="text-xs text-muted-foreground">
								Edit title, SKU, inventory, and price per variant.
							</p>
							<div class="mt-2 overflow-auto rounded-lg border">
								<table class="w-full text-sm">
									<thead class="border-b bg-muted/50">
										<tr>
											<th class="px-3 py-2 text-left font-medium">Option</th>
											<th class="px-3 py-2 text-left font-medium">Title</th>
											<th class="px-3 py-2 text-left font-medium">SKU</th>
											<th class="px-3 py-2 text-left font-medium">Managed inventory</th>
											<th class="px-3 py-2 text-left font-medium">Allow backorder</th>
											<th class="px-3 py-2 text-left font-medium">Price EUR</th>
										</tr>
									</thead>
									<tbody>
										{#if editSheetVariantRows.length === 0}
											<tr>
												<td colspan="6" class="px-3 py-8 text-center text-muted-foreground">
													Add options and values above to generate variants.
												</td>
											</tr>
										{:else}
											{#each editSheetVariantRows as row (row.key)}
												<tr class="border-b last:border-0">
													<td class="px-3 py-2 text-muted-foreground">{row.optionTitle}</td>
													<td class="px-3 py-2">
														<Input
															value={row.title}
															oninput={(e) =>
																updateEditSheetVariantRow(row.key, {
																	title: (e.currentTarget as HTMLInputElement).value
																})}
															class="h-8 w-full min-w-[80px]"
														/>
													</td>
													<td class="px-3 py-2">
														<Input
															value={row.sku}
															oninput={(e) =>
																updateEditSheetVariantRow(row.key, {
																	sku: (e.currentTarget as HTMLInputElement).value
																})}
															placeholder="SKU"
															class="h-8 w-24"
														/>
													</td>
													<td class="px-3 py-2">
														<input
															type="checkbox"
															class="rounded border-muted-foreground/50"
															checked={row.manage_inventory}
															onchange={(e) =>
																updateEditSheetVariantRow(row.key, {
																	manage_inventory: (e.currentTarget as HTMLInputElement).checked
																})}
														/>
													</td>
													<td class="px-3 py-2">
														<input
															type="checkbox"
															class="rounded border-muted-foreground/50"
															checked={row.allow_backorder}
															onchange={(e) =>
																updateEditSheetVariantRow(row.key, {
																	allow_backorder: (e.currentTarget as HTMLInputElement).checked
																})}
														/>
													</td>
													<td class="px-3 py-2">
														<Input type="text" value="€ 0" class="h-8 w-20" readonly />
													</td>
												</tr>
											{/each}
										{/if}
									</tbody>
								</table>
							</div>
						</div>
						{#if variantsEditError}
							<p class="mt-4 text-sm text-destructive">{variantsEditError}</p>
						{/if}
					</div>
					<div class="flex justify-end gap-2 border-t p-4">
						<Button variant="outline" onclick={() => (variantsEditSheetOpen = false)}>Cancel</Button
						>
						<Button onclick={submitVariantsEditSheet} disabled={variantsEditSubmitting}>
							{variantsEditSubmitting ? 'Saving…' : 'Save'}
						</Button>
					</div>
				</div>
			</Sheet.Content>
		</Sheet.Root>

		<!-- Edit single variant sheet -->
		<Sheet.Root bind:open={editVariantSheetOpen}>
			<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
				<div class="flex h-full flex-col">
					<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
						<Sheet.Title>Edit Variant</Sheet.Title>
					</Sheet.Header>
					<div class="flex-1 overflow-auto p-6">
						{#if editingVariant}
							<div class="flex flex-col gap-4">
								<div class="flex flex-col gap-2">
									<label for="edit-variant-title" class="text-sm font-medium">Title</label>
									<Input id="edit-variant-title" bind:value={editVariantTitle} class="h-9" />
								</div>
								<div class="flex flex-col gap-2">
									<label for="edit-variant-material" class="text-sm font-medium">
										Material <span class="font-normal text-muted-foreground">(Optional)</span>
									</label>
									<Input id="edit-variant-material" bind:value={editVariantMaterial} class="h-9" />
								</div>
								{#if options.length === 1}
									<div class="flex flex-col gap-2">
										<label for="edit-variant-option" class="text-sm font-medium"
											>{options[0]?.title ?? 'Option'}</label
										>
										<Input
											id="edit-variant-option"
											value={editingVariant.title}
											class="h-9 bg-muted/50"
											readonly
										/>
									</div>
								{/if}
								<div class="flex flex-col gap-2">
									<p class="text-sm font-medium">Stock & Inventory</p>
									<div class="grid gap-3">
										<div>
											<label for="edit-variant-sku" class="text-xs text-muted-foreground"
												>SKU (Optional)</label
											>
											<Input id="edit-variant-sku" bind:value={editVariantSku} class="h-9" />
										</div>
										<div>
											<label for="edit-variant-ean" class="text-xs text-muted-foreground"
												>EAN (Optional)</label
											>
											<Input id="edit-variant-ean" bind:value={editVariantEan} class="h-9" />
										</div>
										<div>
											<label for="edit-variant-upc" class="text-xs text-muted-foreground"
												>UPC (Optional)</label
											>
											<Input id="edit-variant-upc" bind:value={editVariantUpc} class="h-9" />
										</div>
										<div>
											<label for="edit-variant-barcode" class="text-xs text-muted-foreground"
												>Barcode (Optional)</label
											>
											<Input
												id="edit-variant-barcode"
												bind:value={editVariantBarcode}
												class="h-9"
											/>
										</div>
									</div>
								</div>
								<div class="flex flex-col gap-2">
									<p class="text-sm font-medium">Attributes</p>
									<p class="text-xs text-muted-foreground">
										Values default from product attributes; variant overrides when set. Changes are saved as variant attribute values.
									</p>
									<div class="space-y-3 text-sm">
										{#each editVariantAttributes as attr (attr.id)}
											<div class="flex items-end gap-2">
												<div class="min-w-0 flex-1">
													<label for="edit-variant-attr-{attr.id}" class="font-medium text-muted-foreground">{attr.title}</label>
													<Input
														id="edit-variant-attr-{attr.id}"
														class="mt-1 h-9"
														value={attr.value}
														oninput={(e) => {
															const val = (e.currentTarget as HTMLInputElement).value;
															editVariantAttributes = editVariantAttributes.map((a) =>
																a.id === attr.id ? { ...a, value: val } : a
															);
														}}
													/>
												</div>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													class="size-9 shrink-0 text-muted-foreground hover:text-destructive"
													onclick={() => removeEditVariantAttribute(attr.id)}
													aria-label="Remove attribute"
												>
													<X class="size-4" />
												</Button>
											</div>
										{/each}
										<div class="flex items-end gap-2 pt-1">
											<select
												class="flex h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
												bind:value={editVariantAddAttributeId}
												aria-label="Add attribute"
											>
												<option value="">Add attribute…</option>
												{#each availableAttributesList.filter((a) => !editVariantAttributes.some((e) => e.id === a.id)) as att (att.id)}
													<option value={att.id}>{att.title}</option>
												{/each}
											</select>
											<Button
												type="button"
												variant="outline"
												size="sm"
												class="shrink-0"
												onclick={addEditVariantAttribute}
												disabled={!editVariantAddAttributeId}
											>
												Add
											</Button>
										</div>
									</div>
								</div>
								<div class="flex flex-col gap-2">
									<div class="flex items-center gap-2">
										<button
											type="button"
											role="switch"
											aria-checked={editVariantManageInventory}
											aria-label="Manage inventory"
											class={cn(
												'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
												editVariantManageInventory ? 'bg-primary' : 'bg-input'
											)}
											onclick={() => (editVariantManageInventory = !editVariantManageInventory)}
										>
											<span
												class={cn(
													'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
													editVariantManageInventory ? 'translate-x-5' : 'translate-x-[1px]'
												)}
											></span>
										</button>
										<span class="text-sm font-medium">Manage inventory</span>
									</div>
									<p class="text-xs text-muted-foreground">
										When enabled, we'll change the inventory quantity for you when orders and
										returns are created.
									</p>
								</div>
								<div class="flex flex-col gap-2">
									<div class="flex items-center gap-2">
										<button
											type="button"
											role="switch"
											aria-checked={editVariantAllowBackorder}
											aria-label="Allow backorders"
											class={cn(
												'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
												editVariantAllowBackorder ? 'bg-primary' : 'bg-input'
											)}
											onclick={() => (editVariantAllowBackorder = !editVariantAllowBackorder)}
										>
											<span
												class={cn(
													'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
													editVariantAllowBackorder ? 'translate-x-5' : 'translate-x-[1px]'
												)}
											></span>
										</button>
										<span class="text-sm font-medium">Allow backorders</span>
									</div>
									<p class="text-xs text-muted-foreground">
										When enabled, customers can purchase the variant even if there's no available
										quantity.
									</p>
								</div>
								{#if editVariantError}
									<p class="text-sm text-destructive">{editVariantError}</p>
								{/if}
							</div>
						{/if}
					</div>
					<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
						<Button
							variant="outline"
							onclick={closeEditVariantSheet}
							disabled={editVariantSubmitting}
						>
							Cancel
						</Button>
						<Button onclick={submitEditVariant} disabled={editVariantSubmitting}>
							{editVariantSubmitting ? 'Saving…' : 'Save'}
						</Button>
					</Sheet.Footer>
				</div>
			</Sheet.Content>
		</Sheet.Root>
	{/if}

	<!-- Sales Channels Sheet -->
	<Sheet.Root bind:open={salesChannelsSheetOpen}>
		<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
			<div class="flex h-full flex-col">
				<div class="flex-1 overflow-auto p-6 pt-12">
					<h2 class="text-lg font-semibold">Sales Channels</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Select which sales channels this product should be available in.
					</p>
					<div class="mt-6 flex flex-col gap-4">
						<div class="relative">
							<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search sales channels"
								bind:value={salesChannelsSearchQuery}
								class="h-9 rounded-md pl-9"
							/>
						</div>
						<div class="flex flex-col gap-2">
							{#if filteredSalesChannels.length === 0}
								<p class="py-8 text-center text-sm text-muted-foreground">
									No sales channels found.
								</p>
							{:else}
								{#each filteredSalesChannels as channel (channel.id)}
									<div class="flex items-center justify-between rounded-md border p-3">
										<div class="flex flex-col gap-1">
											<span class="text-sm font-medium">{channel.name}</span>
											{#if channel.is_default}
												<span class="text-xs text-muted-foreground">Default</span>
											{/if}
										</div>
										<button
											type="button"
											role="switch"
											aria-checked={productSalesChannelIds.has(channel.id)}
											aria-label={`Toggle ${channel.name}`}
											class={cn(
												'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
												productSalesChannelIds.has(channel.id) ? 'bg-primary' : 'bg-input'
											)}
											onclick={() => {
												const newSet = new Set(productSalesChannelIds);
												if (newSet.has(channel.id)) {
													newSet.delete(channel.id);
												} else {
													newSet.add(channel.id);
												}
												productSalesChannelIds = newSet;
											}}
										>
											<span
												class={cn(
													'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
													productSalesChannelIds.has(channel.id)
														? 'translate-x-5'
														: 'translate-x-[1px]'
												)}
											></span>
										</button>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
				<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
					<Button
						variant="outline"
						onclick={() => (salesChannelsSheetOpen = false)}
						disabled={salesChannelsSubmitting}
					>
						Cancel
					</Button>
					<Button onclick={updateProductSalesChannels} disabled={salesChannelsSubmitting}>
						{salesChannelsSubmitting ? 'Saving…' : 'Save'}
					</Button>
				</Sheet.Footer>
			</div>
		</Sheet.Content>
	</Sheet.Root>
</div>
