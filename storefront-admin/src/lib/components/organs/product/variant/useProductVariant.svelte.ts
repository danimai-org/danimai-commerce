import type { ProductVariant, ProductOption, ProductDetail } from '$lib/hooks/use-product-detail.svelte.js';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

export type EditVariantAttribute = { id: string; title: string; type: string; value: string };
export type AvailableAttribute = { id: string; title: string; type: string };
export type ProductAttributeLike = { id: string; title: string; value?: string };

export function useProductVariant(
	productId: () => string,
	product: () => ProductDetail | null,
	options: () => ProductOption[],
	variants: () => ProductVariant[],
	getLoadProduct: () => () => Promise<void>,
	getLoadOptionsAndVariants: () => () => Promise<void>,
	availableAttributesList: () => AvailableAttribute[],
	getLoadAvailableAttributes: () => () => void,
	productAttributes: () => Array<{ id: string; title: string; value?: string }>
) {
	const loadProduct = () => getLoadProduct()();
	const loadOptionsAndVariants = () => getLoadOptionsAndVariants()();
	const loadAvailableAttributes = () => getLoadAvailableAttributes()();
	let variantsEditSheetOpen = $state(false);
	let variantPricesMap = $state<Map<string, string>>(new Map());

	async function loadVariantPrices() {
		const newPricesMap = new Map<string, string>();
		const v = variants();
		if (v.length === 0) {
			variantPricesMap = newPricesMap;
			return;
		}
		for (const variant of v) {
			try {
				const variantRes = await fetch(`${API_BASE}/product-variants/${variant.id}`, {
					cache: 'no-store'
				});
				if (variantRes.ok) {
					const variantData = (await variantRes.json()) as {
						prices?: Array<{ amount: string; currency_code: string }>;
					};
					if (variantData.prices) {
						const eurPrice = variantData.prices.find(
							(p) => p.currency_code.toLowerCase() === 'eur'
						);
						if (eurPrice) {
							newPricesMap.set(variant.id, eurPrice.amount);
						}
					}
				}
			} catch {
				// continue
			}
		}
		variantPricesMap = newPricesMap;
	}

	$effect(() => {
		const v = variants();
		if (v.length > 0) {
			loadVariantPrices();
		} else {
			variantPricesMap = new Map();
		}
	});

	async function openVariantsEditSheet() {
		const p = product();
		if (!p?.id) {
			await loadProduct();
			if (!product()?.id) return;
		}
		await loadOptionsAndVariants();
		variantsEditSheetOpen = true;
	}

	// Edit single variant sheet
	let editVariantSheetOpen = $state(false);
	let editingVariant = $state<ProductVariant | null>(null);
	let editVariantAttributes = $state<EditVariantAttribute[]>([]);
	let editVariantTitle = $state('');
	let editVariantSize = $state('');
	let editVariantMaterial = $state('');
	let editVariantSku = $state('');
	let editVariantEan = $state('');
	let editVariantUpc = $state('');
	let editVariantBarcode = $state('');
	let editVariantManageInventory = $state(false);
	let editVariantAllowBackorder = $state(false);
	let editVariantPrice = $state('');
	let editVariantError = $state<string | null>(null);
	let editVariantSubmitting = $state(false);
	let editVariantAddAttributeId = $state('');

	async function openEditVariantSheet(v: ProductVariant) {
		editingVariant = v;
		editVariantTitle = v.title;
		editVariantSize = '';
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
		editVariantPrice = '';
		const p = product();
		try {
			const res = await fetch(`${API_BASE}/product-variants/${v.id}`, { cache: 'no-store' });
			if (res.ok) {
				const data = await res.json();
				editVariantAttributes = data.attributes ?? [];
				const opts = options();
				if (opts.length === 1) {
					const optionTitle = opts[0].title;
					if (editVariantAttributes.length > 0) {
						const matchingAttr = editVariantAttributes.find((a) =>
							a.title.toLowerCase() === optionTitle.toLowerCase()
						);
						if (matchingAttr?.value) {
							editVariantSize = matchingAttr.value;
						} else {
							editVariantSize = v.title;
						}
					} else {
						editVariantSize = v.title;
					}
				}
				if (data.prices) {
					const eurPrice = data.prices.find(
						(p: { currency_code: string }) => p.currency_code.toLowerCase() === 'eur'
					);
					if (eurPrice) {
						editVariantPrice = (parseFloat(eurPrice.amount) / 100).toString();
					}
				}
			} else {
				editVariantAttributes = (productAttributes() ?? []).map((a) => ({
					id: a.id,
					title: a.title,
					type: 'type' in a && typeof (a as EditVariantAttribute).type === 'string' ? (a as EditVariantAttribute).type : 'text',
					value: a.value ?? ''
				}));
			}
		} catch {
			editVariantAttributes = (productAttributes() ?? []).map((a) => ({
				id: a.id,
				title: a.title,
				type: 'text',
				value: a.value ?? ''
			}));
		}
	}

	function addEditVariantAttribute() {
		if (!editVariantAddAttributeId) return;
		const att = availableAttributesList().find((a) => a.id === editVariantAddAttributeId);
		if (!att || editVariantAttributes.some((a) => a.id === att.id)) return;
		editVariantAttributes = [
			...editVariantAttributes,
			{ id: att.id, title: att.title, type: att.type, value: '' }
		];
		editVariantAddAttributeId = '';
	}

	function removeEditVariantAttribute(attributeId: string) {
		editVariantAttributes = editVariantAttributes.filter((a) => a.id !== attributeId);
	}

	function updateEditVariantAttributeValue(attributeId: string, value: string) {
		editVariantAttributes = editVariantAttributes.map((a) =>
			a.id === attributeId ? { ...a, value } : a
		);
	}

	function closeEditVariantSheet() {
		editVariantSheetOpen = false;
		editingVariant = null;
		editVariantAttributes = [];
		editVariantPrice = '';
		editVariantSize = '';
		editVariantError = null;
	}

	async function submitEditVariant() {
		const v = editingVariant;
		if (!v) return;
		editVariantError = null;
		editVariantSubmitting = true;
		try {
			const finalTitle = editVariantTitle.trim() || v.title;
			const body: Record<string, unknown> = {
				title: finalTitle,
				product_id: v.product_id ?? undefined,
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
			const priceAmount = String(editVariantPrice || '').trim();
			if (priceAmount) {
				const priceInCents = Math.round(parseFloat(priceAmount) * 100);
				if (!isNaN(priceInCents) && priceInCents > 0) {
					body.prices = [{ amount: priceInCents, currency_code: 'EUR' }];
				}
			}
			const opts = options();
			if (opts.length === 1) {
				const optionTitle = opts[0].title;
				const existingAttrIndex = editVariantAttributes.findIndex((a) =>
					a.title.toLowerCase() === optionTitle.toLowerCase()
				);
				if (existingAttrIndex >= 0) {
					editVariantAttributes[existingAttrIndex] = {
						...editVariantAttributes[existingAttrIndex],
						value: editVariantSize.trim()
					};
				} else if (editVariantSize.trim()) {
					const matchingAttr = availableAttributesList().find((a) =>
						a.title.toLowerCase() === optionTitle.toLowerCase()
					);
					if (matchingAttr) {
						editVariantAttributes = [
							...editVariantAttributes,
							{ id: matchingAttr.id, title: matchingAttr.title, type: matchingAttr.type, value: editVariantSize.trim() }
						];
					}
				}
			}
			body.attribute_values = editVariantAttributes.map((a) => ({
				attribute_id: a.id,
				value: a.value ?? ''
			}));
			const res = await fetch(`${API_BASE}/product-variants/${v.id}`, {
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

	// Delete variant
	let variantToDelete = $state<ProductVariant | null>(null);
	let deleteVariantConfirmOpen = $state(false);
	let deleteVariantSubmitting = $state(false);

	function openDeleteVariantConfirm(v: ProductVariant) {
		variantToDelete = v;
		deleteVariantConfirmOpen = true;
	}

	function closeDeleteVariantConfirm() {
		if (!deleteVariantSubmitting) {
			deleteVariantConfirmOpen = false;
			variantToDelete = null;
		}
	}

	async function confirmDeleteVariant() {
		const v = variantToDelete;
		if (!v) return;
		deleteVariantSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-variants`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ variant_ids: [v.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			deleteVariantConfirmOpen = false;
			variantToDelete = null;
			loadOptionsAndVariants();
		} catch {
			// ignore
		} finally {
			deleteVariantSubmitting = false;
		}
	}

	// Variant image sheet
	let variantImageVariant = $state<ProductVariant | null>(null);
	let variantImageUrl = $state('');
	let variantImageSheetOpen = $state(false);
	let variantImageSubmitting = $state(false);
	let variantImageError = $state<string | null>(null);

	function openVariantImageSheet(v: ProductVariant) {
		variantImageVariant = v;
		variantImageUrl = v.thumbnail ?? '';
		variantImageError = null;
		variantImageSheetOpen = true;
	}

	async function saveVariantImage() {
		const v = variantImageVariant;
		if (!v?.id) return;
		variantImageSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-variants/${v.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ thumbnail: variantImageUrl || null })
			});
			if (res.ok) {
				await loadOptionsAndVariants();
				variantImageError = null;
				variantImageSheetOpen = false;
			} else {
				variantImageError = await res.text();
			}
		} catch (e) {
			variantImageError = e instanceof Error ? e.message : String(e);
		} finally {
			variantImageSubmitting = false;
		}
	}

	return {
		// Variants edit sheet
		get variantsEditSheetOpen() {
			return variantsEditSheetOpen;
		},
		set variantsEditSheetOpen(value: boolean) {
			variantsEditSheetOpen = value;
		},
		variantPricesMap: () => variantPricesMap,
		openVariantsEditSheet,
		// Edit single variant
		get editVariantSheetOpen() {
			return editVariantSheetOpen;
		},
		set editVariantSheetOpen(value: boolean) {
			editVariantSheetOpen = value;
		},
		editingVariant: () => editingVariant,
		editVariantAttributes: () => editVariantAttributes,
		editVariantTitle: { get: () => editVariantTitle, set: (val: string) => { editVariantTitle = val; } },
		editVariantSize: { get: () => editVariantSize, set: (val: string) => { editVariantSize = val; } },
		editVariantMaterial: { get: () => editVariantMaterial, set: (val: string) => { editVariantMaterial = val; } },
		editVariantSku: { get: () => editVariantSku, set: (val: string) => { editVariantSku = val; } },
		editVariantEan: { get: () => editVariantEan, set: (val: string) => { editVariantEan = val; } },
		editVariantUpc: { get: () => editVariantUpc, set: (val: string) => { editVariantUpc = val; } },
		editVariantBarcode: { get: () => editVariantBarcode, set: (val: string) => { editVariantBarcode = val; } },
		editVariantManageInventory: { get: () => editVariantManageInventory, set: (val: boolean) => { editVariantManageInventory = val; } },
		editVariantAllowBackorder: { get: () => editVariantAllowBackorder, set: (val: boolean) => { editVariantAllowBackorder = val; } },
		editVariantPrice: { get: () => editVariantPrice, set: (val: string) => { editVariantPrice = val; } },
		editVariantError: () => editVariantError,
		editVariantSubmitting: () => editVariantSubmitting,
		editVariantAddAttributeId: { get: () => editVariantAddAttributeId, set: (val: string) => { editVariantAddAttributeId = val; } },
		openEditVariantSheet,
		addEditVariantAttribute,
		removeEditVariantAttribute,
		updateEditVariantAttributeValue,
		closeEditVariantSheet,
		submitEditVariant,
		// Delete variant
		variantToDelete: () => variantToDelete,
		get deleteVariantConfirmOpen() {
			return deleteVariantConfirmOpen;
		},
		set deleteVariantConfirmOpen(value: boolean) {
			deleteVariantConfirmOpen = value;
		},
		deleteVariantSubmitting: () => deleteVariantSubmitting,
		openDeleteVariantConfirm,
		closeDeleteVariantConfirm,
		confirmDeleteVariant,
		// Variant image
		variantImageVariant: () => variantImageVariant,
		variantImageUrl: { get: () => variantImageUrl, set: (val: string) => { variantImageUrl = val; } },
		get variantImageSheetOpen() {
			return variantImageSheetOpen;
		},
		set variantImageSheetOpen(value: boolean) {
			variantImageSheetOpen = value;
		},
		variantImageSubmitting: () => variantImageSubmitting,
		variantImageError: () => variantImageError,
		openVariantImageSheet,
		saveVariantImage
	};
}
