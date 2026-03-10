<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ProductVariantsTable from '$lib/products/ProductVariantsTable.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		DeleteConfirmationModal,
		ProductDetailVariantsSection,
		ProductHero,
		ProductStatus,
		ProductOrganisation,
		ProductSalesChannel,
		ProductAttribute,
		MetadataComponent,
		JSONComponent
	} from '$lib/components/organs/index.js';
	import ProductShippingConfigCard from '$lib/components/organs/product-detail/ProductShippingConfigCard.svelte';
	import Upload from '@lucide/svelte/icons/upload-cloud';
	import Pencil from '@lucide/svelte/icons/pencil';
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';
	import { useProductDetail } from '$lib/hooks/use-product-detail.svelte.js';
	import type { ProductVariant } from '$lib/hooks/use-product-detail.svelte.js';

	const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

	const productId = $derived(page.params?.id ?? '');
	const {
		product,
		loading,
		error,
		category,
		options,
		variants,
		allSalesChannels,
		productSalesChannelIds,
		setProductSalesChannelIds,
		loadProduct,
		loadCategory,
		loadOptionsAndVariants,
		updateProductSalesChannels
	} = useProductDetail(() => page.params?.id ?? '');

	let productImageUrl = $state('');
	let productImageFile = $state<File | null>(null);
	let productImageFilePreview = $state<string | null>(null);
	let addMediaSheetOpen = $state(false);
	let addMediaError = $state<string | null>(null);
	let addMediaSubmitting = $state(false);
	let variantImageVariant = $state<ProductVariant | null>(null);
	let variantImageUrl = $state('');
	let variantImageSheetOpen = $state(false);
	let variantImageSubmitting = $state(false);
	let variantImageError = $state<string | null>(null);
	let availableAttributesList = $state<Array<{ id: string; title: string; type: string }>>([]);

	async function loadAvailableAttributes() {
		try {
			const res = await fetch(`${API_BASE}/product-attributes?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as {
					rows?: Array<{ id: string; title: string; type: string }>;
				};
				availableAttributesList = j.rows ?? [];
			} else {
				availableAttributesList = [];
			}
		} catch {
			availableAttributesList = [];
		}
	}

	function openAddMediaSheet() {
		productImageUrl =
			product?.thumbnail && isPersistentImageUrl(product.thumbnail) ? product.thumbnail : '';
		productImageFilePreview = null;
		productImageFile = null;
		addMediaError = null;
		addMediaSheetOpen = true;
	}

	function onAddMediaFileSelect(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file && file.type.startsWith('image/')) {
			if (productImageFilePreview) URL.revokeObjectURL(productImageFilePreview);
			productImageFile = file;
			productImageFilePreview = URL.createObjectURL(file);
			productImageUrl = productImageFilePreview;
		}
		input.value = '';
	}

	function isPersistentImageUrl(url: string | null | undefined): boolean {
		if (!url) return false;
		return url.startsWith('http://') || url.startsWith('https://');
	}

	async function saveProductImage() {
		if (!productId) return;
		if (!productImageFile && productImageUrl?.startsWith('blob:')) {
			return;
		}
		addMediaSubmitting = true;
		addMediaError = null;
		try {
			let thumbnail: string | null = productImageUrl?.trim() || null;
			if (productImageFile) {
				const formData = new FormData();
				formData.append('file', productImageFile);
				const uploadRes = await fetch(`${API_BASE}/upload`, {
					method: 'POST',
					body: formData
				});
				if (!uploadRes.ok) {
					const data = (await uploadRes.json()) as { error?: string };
					addMediaError = data.error || uploadRes.statusText;
					return;
				}
				const data = (await uploadRes.json()) as { url: string };
				thumbnail = data.url;
			} else if (thumbnail?.startsWith('blob:')) {
				return;
			}
			const res = await fetch(`${API_BASE}/products/${productId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ thumbnail })
			});
			if (res.ok) {
				await loadProduct();
				if (productImageFilePreview) {
					URL.revokeObjectURL(productImageFilePreview);
					productImageFilePreview = null;
				}
				productImageFile = null;
				addMediaSheetOpen = false;
			} else {
				addMediaError = await res.text();
			}
		} catch (e) {
			addMediaError = e instanceof Error ? e.message : String(e);
		} finally {
			addMediaSubmitting = false;
		}
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

	let statusUpdating = $state(false);

	async function updateStatus(newStatus: 'draft' | 'proposed' | 'published' | 'rejected') {
		if (!product) return;
		statusUpdating = true;
		try {
			const res = await fetch(`${API_BASE}/products/${product.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			loadProduct();
		} catch (e) {
			console.error('Failed to update status:', e);
		} finally {
			statusUpdating = false;
		}
	}

	const metadataKeysCount = $derived(
		product?.metadata && typeof product.metadata === 'object'
			? Object.keys(product.metadata).length
			: 0
	);

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
		priceAmount: string;
		variantId?: string;
	};
	let editSheetVariantRows = $state<EditSheetVariantRow[]>([]);
	let variantPricesMap = $state<Map<string, string>>(new Map());

	function cartesian<T>(arrays: T[][]): T[][] {
		if (arrays.length === 0) return [[]];
		const [first, ...rest] = arrays;
		const restProduct = cartesian(rest);
		return first.flatMap((item) => restProduct.map((combo) => [item, ...combo]));
	}

	function syncEditSheetVariantRows() {
		// Only use options that have at least one value (so we show existing variant data even when some options are unused)
		const optionsWithValues = editOptions.filter(
			(o) => o.title.trim() && o.values.filter((v) => v.trim()).length > 0
		);
		const valueArrays = optionsWithValues.map((o) => o.values.filter((v) => v.trim()));
		if (valueArrays.length === 0 || valueArrays.some((a) => a.length === 0)) {
			editSheetVariantRows = [];
			return;
		}
		const combinations = cartesian(valueArrays);
		const optionTitles = optionsWithValues.map((o) => o.title);
		editSheetVariantRows = combinations.map((combo) => {
			const key = combo.join('|');
			const optionTitle = combo.join(' / ');
			// Try to find matching variant - check both exact match and normalized match
			const variant = variants.find((v) => {
				const normalizedVariantTitle = v.title.trim();
				const normalizedOptionTitle = optionTitle.trim();
				return (
					normalizedVariantTitle === normalizedOptionTitle ||
					normalizedVariantTitle.toLowerCase() === normalizedOptionTitle.toLowerCase()
				);
			});
			if (variant) {
				// Get existing price for this variant, convert from cents to euros
				const priceInCents = variantPricesMap.get(variant.id);
				const priceAmount = priceInCents ? (parseFloat(priceInCents) / 100).toString() : '';
				return {
					key,
					optionTitle,
					title: variant.title,
					sku: variant.sku ?? '',
					manage_inventory: variant.manage_inventory,
					allow_backorder: variant.allow_backorder ?? false,
					priceAmount,
					variantId: variant.id
				};
			}
			return {
				key,
				optionTitle,
				title: optionTitle,
				sku: '',
				manage_inventory: false,
				allow_backorder: false,
				priceAmount: ''
			};
		});
	}

	async function loadVariantPrices() {
		const newPricesMap = new Map<string, string>();
		if (variants.length === 0) {
			variantPricesMap = newPricesMap;
			return;
		}
		
		// Try to load prices by fetching each variant individually
		// The variant endpoint might return price information
		for (const variant of variants) {
			try {
				const variantRes = await fetch(`${API_BASE}/product-variants/${variant.id}`, { cache: 'no-store' });
				if (variantRes.ok) {
					const variantData = (await variantRes.json()) as { prices?: Array<{ amount: string; currency_code: string }> };
					if (variantData.prices) {
						const eurPrice = variantData.prices.find((p) => p.currency_code.toLowerCase() === 'eur');
						if (eurPrice) {
							newPricesMap.set(variant.id, eurPrice.amount);
						}
					}
				}
			} catch {
				// Continue if variant fetch fails
			}
		}
		variantPricesMap = newPricesMap;
	}

	async function openVariantsEditSheet() {
		if (!product || !product.id) {
			await loadProduct();
			if (!product || !product.id) return;
		}
		await loadOptionsAndVariants();
		await loadVariantPrices();

		variantsEditSheetOpen = true;
		variantsEditError = null;

		// Use existing options, or infer one option from variants when none exist
		const optionsToUse =
			options.length > 0
				? options
				: variants.length > 0
					? [{ id: '', title: 'Size', product_id: productId as string | null }]
					: [];

		// Extract option values from existing variants (use arrays to preserve order)
		const optionValuesMap = new Map<string, string[]>();
		optionsToUse.forEach((opt) => {
			optionValuesMap.set(opt.id, []);
		});

		function hasValueCaseInsensitive(arr: string[], value: string): boolean {
			const lower = value.trim().toLowerCase();
			return arr.some((x) => x.trim().toLowerCase() === lower);
		}
		if (variants.length > 0) {
			variants.forEach((variant) => {
				if (optionsToUse.length === 1) {
					const optId = optionsToUse[0].id;
					const arr = optionValuesMap.get(optId);
					const val = variant.title.trim();
					if (arr && val && !hasValueCaseInsensitive(arr, val)) {
						arr.push(val);
					}
				} else if (optionsToUse.length > 1) {
					const parts = variant.title
						.split('/')
						.map((p) => p.trim())
						.filter(Boolean);
					// Allow fewer parts than options (e.g. "S" → assign to first option only)
					optionsToUse.forEach((opt, index) => {
						const part = parts[index];
						if (!part) return;
						const arr = optionValuesMap.get(opt.id);
						if (arr && !hasValueCaseInsensitive(arr, part)) {
							arr.push(part);
						}
					});
				}
			});
		}

		// Build editOptions only for options that have at least one value (don't show unused options like Color with no values)
		editOptions = optionsToUse
			.filter((opt) => (optionValuesMap.get(opt.id) ?? []).length > 0)
			.map((opt) => ({
				id: opt.id || null,
				title: opt.title,
				values: optionValuesMap.get(opt.id) ?? []
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
		const opt = editOptions[optionIndex];
		if (!opt) return;
		const existsCaseInsensitive = opt.values.some(
			(existing) => existing.trim().toLowerCase() === v.toLowerCase()
		);
		if (existsCaseInsensitive) return;
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

			// 2. Update existing variants (including prices)
			for (const row of editSheetVariantRows) {
				if (!row.variantId) continue;
				const v = variants.find((x) => x.id === row.variantId);
				if (!v) continue;
				
				const body: Record<string, unknown> = {
					title: row.title,
					sku: row.sku.trim() || null,
					manage_inventory: row.manage_inventory,
					allow_backorder: row.allow_backorder
				};
				
				// Add prices if provided
				const priceAmount = String(row.priceAmount || '').trim();
				if (priceAmount) {
					const priceInCents = Math.round(parseFloat(priceAmount) * 100);
					if (!isNaN(priceInCents) && priceInCents > 0) {
						body.prices = [{ amount: priceInCents, currency_code: 'EUR' }];
					}
				}
				
				const res = await fetch(`${API_BASE}/product-variants/${row.variantId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				});
				if (!res.ok) throw new Error(await res.text());
			}

			// 3. Create new variants (including prices)
			for (const row of editSheetVariantRows) {
				if (row.variantId) continue;
				
				const body: Record<string, unknown> = {
					title: row.title,
					product_id: productId,
					sku: row.sku.trim() || null,
					manage_inventory: row.manage_inventory,
					allow_backorder: row.allow_backorder
				};
				
				// Add prices if provided
				const priceAmount = String(row.priceAmount || '').trim();
				if (priceAmount) {
					const priceInCents = Math.round(parseFloat(priceAmount) * 100);
					if (!isNaN(priceInCents) && priceInCents > 0) {
						body.prices = [{ amount: priceInCents, currency_code: 'EUR' }];
					}
				}
				
				const res = await fetch(`${API_BASE}/product-variants`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
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
			let toDeleteOptionIds = options.filter((o) => !editOptionIds.has(o.id)).map((o) => o.id);
			if (toDeleteOptionIds.length > 0) {
				const res = await fetch(`${API_BASE}/product-options`, {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ option_ids: toDeleteOptionIds })
				});
				if (!res.ok) {
					const errorText = await res.text();
					let errorMessage = errorText;
					try {
						const errorJson = JSON.parse(errorText);
						errorMessage = errorJson.message || errorText;
						// Extract option IDs from error message if it's about options in use
						if (errorMessage.includes('Options:') && errorMessage.includes('Variants:')) {
							const optionsMatch = errorMessage.match(/Options:\s*([^,]+(?:,\s*[^,]+)*)/);
							if (optionsMatch) {
								const usedOptionIds = optionsMatch[1].split(',').map(id => id.trim());
								// Filter out used options and retry with remaining ones
								const safeToDeleteIds = toDeleteOptionIds.filter(id => !usedOptionIds.includes(id));
								if (safeToDeleteIds.length > 0) {
									const retryRes = await fetch(`${API_BASE}/product-options`, {
										method: 'DELETE',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({ option_ids: safeToDeleteIds })
									});
									if (!retryRes.ok) {
										const retryErrorText = await retryRes.text();
										let retryErrorMessage = retryErrorText;
										try {
											const retryErrorJson = JSON.parse(retryErrorText);
											retryErrorMessage = retryErrorJson.message || retryErrorText;
										} catch {
											// If parsing fails, use the text as-is
										}
										throw new Error(retryErrorMessage);
									}
									// Show warning about options that couldn't be deleted
									variantsEditError = `Some options could not be deleted because they are still in use by variants: ${usedOptionIds.join(', ')}`;
								} else {
									// All options were in use, show the error
									throw new Error(errorMessage);
								}
							} else {
								throw new Error(errorMessage);
							}
						} else {
							throw new Error(errorMessage);
						}
					} catch (parseError) {
						// If it's not a JSON error or retry failed, throw the original error
						if (parseError instanceof Error && parseError.message !== errorMessage) {
							throw parseError;
						}
						throw new Error(errorMessage);
					}
				}
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
	let editVariantAttributes = $state<
		Array<{ id: string; title: string; type: string; value: string }>
	>([]);
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
		
		// Load price
		const priceInCents = variantPricesMap.get(v.id);
		editVariantPrice = priceInCents ? (parseFloat(priceInCents) / 100).toString() : '';
		
			try {
				const res = await fetch(`${API_BASE}/product-variants/${v.id}`, { cache: 'no-store' });
				if (res.ok) {
					const data = await res.json();
					editVariantAttributes = data.attributes ?? [];
					// If there's a single option, set the Size field from the corresponding attribute
					// Match by attribute title matching the option title, since options and attributes are separate entities
					if (options.length === 1) {
						const optionTitle = options[0].title;
						if (editVariantAttributes.length > 0) {
							const matchingAttr = editVariantAttributes.find((a) => 
								a.title.toLowerCase() === optionTitle.toLowerCase()
							);
							if (matchingAttr && matchingAttr.value) {
								editVariantSize = matchingAttr.value;
							} else {
								// Fallback: if no matching attribute found, use variant title as Size
								// This handles backwards compatibility with variants that don't have attributes set
								editVariantSize = v.title;
							}
						} else {
							// No attributes exist, use variant title as Size for backwards compatibility
							editVariantSize = v.title;
						}
					}
					// If price wasn't in map, try to get it from the response
					if (!priceInCents && data.prices) {
						const eurPrice = data.prices.find((p: { currency_code: string }) => p.currency_code.toLowerCase() === 'eur');
						if (eurPrice) {
							editVariantPrice = (parseFloat(eurPrice.amount) / 100).toString();
						}
					}
				} else {
					editVariantAttributes = (product?.attributes ?? []).map((a) => ({
						id: a.id,
						title: a.title,
						type: 'type' in a && typeof a.type === 'string' ? a.type : 'text',
						value: a.value ?? ''
					}));
				}
			} catch {
				editVariantAttributes = (product?.attributes ?? []).map((a) => ({
					id: a.id,
					title: a.title,
					type: 'type' in a && typeof a.type === 'string' ? a.type : 'text',
					value: a.value ?? ''
				}));
			}
	}

	function addEditVariantAttribute() {
		if (!editVariantAddAttributeId) return;
		const att = availableAttributesList.find((a) => a.id === editVariantAddAttributeId);
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

	function closeEditVariantSheet() {
		editVariantSheetOpen = false;
		editingVariant = null;
		editVariantAttributes = [];
		editVariantPrice = '';
		editVariantSize = '';
		editVariantError = null;
	}

	async function submitEditVariant() {
		if (!editingVariant) return;
		editVariantError = null;
		editVariantSubmitting = true;
		try {
			// Always use the Title field for the variant title
			const finalTitle = editVariantTitle.trim() || editingVariant.title;
			
			const body: Record<string, unknown> = {
				title: finalTitle,
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
			
			// Add price if provided
			const priceAmount = String(editVariantPrice || '').trim();
			if (priceAmount) {
				const priceInCents = Math.round(parseFloat(priceAmount) * 100);
				if (!isNaN(priceInCents) && priceInCents > 0) {
					body.prices = [{ amount: priceInCents, currency_code: 'EUR' }];
				}
			}
			
			if (options.length === 1) {
				const optionTitle = options[0].title;
				const existingAttrIndex = editVariantAttributes.findIndex((a) => 
					a.title.toLowerCase() === optionTitle.toLowerCase()
				);
				if (existingAttrIndex >= 0) {
					// Update existing attribute with Size value
					// Always update with the Size field value (even if empty) to allow clearing
					editVariantAttributes[existingAttrIndex] = {
						...editVariantAttributes[existingAttrIndex],
						value: editVariantSize.trim()
					};
				} else if (editVariantSize.trim()) {
					// Attribute doesn't exist yet, but Size has a value
					// Try to find the attribute from available attributes list
					const matchingAttr = availableAttributesList.find((a) => 
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
			// ignore for now
		} finally {
			deleteVariantSubmitting = false;
		}
	}

</script>

<svelte:head>
	<title>{product ? `${product.title} | Product` : 'Product'} | Danimai Store</title>
	<meta name="description" content="Manage product." />
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Breadcrumb + actions -->
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
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
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<div class="p-6">
				<div
					class="grid gap-6"
					style="grid-template-columns: 1fr 13rem; grid-auto-rows: minmax(0, auto); align-items: start;"
				>
					<!-- Product card (row 1) -->
					<ProductHero product={product} onSaved={loadProduct} />

					<!-- Right: Status, Visibility, Organisation, Sales Channels, Attributes, Shipping -->
					<div class="row-span-2 flex w-52 flex-col gap-6 self-start">
						<ProductStatus
							status={product?.status as 'draft' | 'proposed' | 'published' | 'rejected' | undefined}
							disabled={statusUpdating || !product}
							onStatusChange={updateStatus}
						/>
						<ProductOrganisation {product} {category} onSaved={async () => { await loadProduct(); await loadCategory(); }} />
						<ProductSalesChannel
							{allSalesChannels}
							{productSalesChannelIds}
							setProductSalesChannelIds={setProductSalesChannelIds}
							updateProductSalesChannels={updateProductSalesChannels}
							onSaved={loadProduct}
						/>
						<ProductAttribute
							attributes={product?.attributes ?? []}
							{product}
							onSaved={loadProduct}
						/>
						<ProductShippingConfigCard />
					</div>

					<!-- Media + Options (row 2, column 1) -->
					<div class="flex min-w-0 flex-col gap-6">
						<!-- Media card -->
						<div class="rounded-lg border bg-card p-6 shadow-sm">
							<div class="flex items-center justify-between">
								<h2 class="font-semibold">Media</h2>
								<Button
									variant="ghost"
									size="icon"
									class="size-8 shrink-0"
									onclick={openAddMediaSheet}
									aria-label="Edit media"
								>
									<Pencil class="size-4" />
								</Button>
							</div>
							{#if product?.thumbnail && isPersistentImageUrl(product.thumbnail)}
								<div class="mt-4">
									<img
										src={product.thumbnail}
										alt="Product"
										class="size-24 rounded-md border object-cover"
									/>
								</div>
							{:else}
								<div
									class="mt-4 flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30 py-8 text-center text-sm text-muted-foreground"
								>
									<Upload class="size-8" />
									<p>No media yet</p>
									<p class="text-xs">Add media to the product to showcase it in your storefront.</p>
								</div>
							{/if}
						</div>

						<ProductDetailVariantsSection
							variants={variants}
							options={options}
							variantPricesMap={variantPricesMap}
							onEditVariant={(row) => {
								const v = variants.find((x) => x.id === row.id);
								if (v) openEditVariantSheet(v);
							}}
							onDeleteVariant={(row) => {
								const v = variants.find((x) => x.id === row.id);
								if (v) openDeleteVariantConfirm(v);
							}}
							onEditOptionsAndVariants={openVariantsEditSheet}
						/>

						<!-- Metadata / JSON -->
						<div class="grid gap-4 sm:grid-cols-2">
							<MetadataComponent
								keysCount={metadataKeysCount}
								productId={product?.id}
								metadata={product?.metadata}
								onSaved={loadProduct}
							/>
							<JSONComponent product={product} options={options} variants={variants} category={category} />
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Add / change product image sheet -->
		<Sheet.Root bind:open={addMediaSheetOpen}>
			<Sheet.Content side="right" class="w-full max-w-md">
				<Sheet.Header class="border-b px-6 py-4">
					<Sheet.Title>Add image</Sheet.Title>
				</Sheet.Header>
				<div class="flex flex-col gap-4 p-6">
					{#if addMediaError}
						<p class="text-sm text-destructive">{addMediaError}</p>
					{/if}
					<div class="flex flex-col gap-2">
						<label for="product-image-url" class="text-sm font-medium">Image URL</label>
						<Input
							id="product-image-url"
							type="url"
							placeholder="https://..."
							bind:value={productImageUrl}
							class="w-full"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Or choose file</span>
						<input
							type="file"
							accept="image/*"
							class="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
							onchange={onAddMediaFileSelect}
						/>
					</div>
					{#if productImageUrl}
						<div class="flex justify-center rounded-md border bg-muted/30 p-4">
							<img
								src={productImageUrl}
								alt="Preview"
								class="max-h-40 rounded object-contain"
								onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
							/>
						</div>
					{/if}
				</div>
				<div class="flex justify-end gap-2 border-t p-4">
					<Button
						variant="outline"
						onclick={() => {
							addMediaSheetOpen = false;
							addMediaError = null;
						}}>Cancel</Button
					>
					<Button onclick={saveProductImage} disabled={addMediaSubmitting}>
						{addMediaSubmitting ? 'Saving…' : 'Save'}
					</Button>
				</div>
			</Sheet.Content>
		</Sheet.Root>

		<!-- Delete variant confirmation -->
		<DeleteConfirmationModal
			bind:open={deleteVariantConfirmOpen}
			entityName="variant"
			entityTitle={variantToDelete
				? `"${variantToDelete.title}"${variantToDelete.sku ? ` (SKU: ${variantToDelete.sku})` : ''}`
				: ''}
			onConfirm={confirmDeleteVariant}
			onCancel={closeDeleteVariantConfirm}
			submitting={deleteVariantSubmitting}
		/>

		<!-- Variant image sheet -->
		<Sheet.Root bind:open={variantImageSheetOpen}>
			<Sheet.Content side="right" class="w-full max-w-md">
				<Sheet.Header class="border-b px-6 py-4">
					<Sheet.Title>Select image</Sheet.Title>
					{#if variantImageVariant}
						<Sheet.Description class="text-sm text-muted-foreground">
							{variantImageVariant.title}
						</Sheet.Description>
					{/if}
				</Sheet.Header>
				<div class="flex flex-col gap-4 p-6">
					{#if variantImageError}
						<p class="text-sm text-destructive">{variantImageError}</p>
					{/if}
					<div class="flex flex-col gap-2">
						<label for="variant-image-url" class="text-sm font-medium">Image URL</label>
						<Input
							id="variant-image-url"
							type="url"
							placeholder="https://..."
							bind:value={variantImageUrl}
							class="w-full"
						/>
					</div>
					{#if variantImageUrl}
						<div class="flex justify-center rounded-md border bg-muted/30 p-4">
							<img
								src={variantImageUrl}
								alt="Preview"
								class="max-h-40 rounded object-contain"
								onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
							/>
						</div>
					{/if}
				</div>
				<div class="flex justify-end gap-2 border-t p-4">
					<Button variant="outline" onclick={() => { variantImageSheetOpen = false; variantImageError = null; }}>Cancel</Button>
					<Button onclick={saveVariantImage} disabled={variantImageSubmitting}>
						{variantImageSubmitting ? 'Saving…' : 'Save'}
					</Button>
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
						<ProductVariantsTable
							rows={editSheetVariantRows}
							updateRow={updateEditSheetVariantRow}
						/>
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
					<div class="min-h-0 flex-1 overflow-auto p-6">
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
											bind:value={editVariantSize}
											class="h-9"
										/>
									</div>
								{/if}
								<div class="flex flex-col gap-2">
									<p class="text-sm font-medium">Pricing</p>
									<div>
										<label for="edit-variant-price" class="text-xs text-muted-foreground"
											>Price EUR (Optional)</label
										>
										<div class="relative mt-1">
											<span
												class="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
												>€</span
											>
											<Input
												id="edit-variant-price"
												bind:value={editVariantPrice}
												type="number"
												step="0.01"
												min="0"
												placeholder="0.00"
												class="h-9 pl-8"
											/>
										</div>
									</div>
								</div>
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
										Values default from product attributes; variant overrides when set. Changes are
										saved as variant attribute values.
									</p>
									<div class="space-y-3 text-sm">
										{#each editVariantAttributes as attr (attr.id)}
											<div class="flex items-end gap-2">
												<div class="min-w-0 flex-1">
													<label
														for="edit-variant-attr-{attr.id}"
														class="font-medium text-muted-foreground">{attr.title}</label
													>
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
					<Sheet.Footer class="flex flex-wrap items-center justify-end gap-2 border-t p-4">
						<div class="flex gap-2">
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
						</div>
					</Sheet.Footer>
				</div>
			</Sheet.Content>
		</Sheet.Root>
	{/if}
</div>
