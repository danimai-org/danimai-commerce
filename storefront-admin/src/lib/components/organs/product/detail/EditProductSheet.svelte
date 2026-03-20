<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import { getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';

	type ProductUpdateFormData = {
		id: string;
		status: 'draft' | 'proposed' | 'published' | 'rejected';
		title: string;
		subtitle: string;
		handle: string;
		description: string;
		discountable: boolean;
	};

	interface Props {
		open: boolean;
		productUpdateForm: SuperValidated<ProductUpdateFormData>;
		onSaved?: () => void | Promise<void>;
	}

	let {
		open = $bindable(false),
		productUpdateForm,
		onSaved = () => {}
	}: Props = $props();

	const product = $derived(getProductDetail()?.data ?? null);

	let apiError = $state<string | null>(null);
	let initializedForId = $state<string | null>(null);

	function normalizeStatus(s: unknown): ProductUpdateFormData['status'] {
		if (s === 'draft' || s === 'proposed' || s === 'published' || s === 'rejected') return s;
		return 'draft';
	}

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, delayed, reset } = superForm(productUpdateForm, {
		resetForm: true,
		invalidateAll: false,
		onResult: async ({ result }) => {
			if (result.type === 'failure') {
				const d = result.data as { error?: string } | undefined;
				apiError = d?.error ?? null;
				return;
			}
			if (result.type === 'error') {
				apiError =
					result.error instanceof Error
						? result.error.message
						: String(result.error ?? 'Something went wrong');
				return;
			}
			if (result.type === 'success') {
				apiError = null;
				open = false;
				await onSaved();
			}
		}
	});

	$effect(() => {
		if (!open || !product?.id) {
			initializedForId = null;
			return;
		}
		if (initializedForId === product.id) return;
		initializedForId = product.id;
		apiError = null;
		const p = product as {
			id: string;
			title?: string | null;
			subtitle?: string | null;
			handle?: string | null;
			description?: string | null;
			discountable?: boolean | null;
			status?: string | null;
		};
		reset({
			data: {
				id: p.id,
				status: normalizeStatus(p.status),
				title: p.title ?? '',
				subtitle: p.subtitle ?? '',
				handle: (p.handle ?? '').replace(/^\//, ''),
				description: p.description ?? '',
				discountable: p.discountable ?? true
			}
		});
	});

	function closeSheet() {
		if ($delayed) return;
		open = false;
		apiError = null;
	}

	function onOpenChange(next: boolean) {
		if (!next) {
			apiError = null;
			initializedForId = null;
		}
	}
</script>

<Sheet.Root bind:open onOpenChange={onOpenChange}>
	<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right">
		<form method="POST" action="?/update" use:enhance class="flex min-h-0 flex-1 flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<input type="hidden" name="status" bind:value={$form.status} />
			<input type="hidden" name="discountable" value={$form.discountable ? 'true' : 'false'} />
			<Sheet.Header class="flex flex-col items-center gap-1.5 text-center sm:text-center">
				<Sheet.Title>Edit Product</Sheet.Title>
			</Sheet.Header>
			<div class="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
				{#if apiError}
					<p class="text-sm text-destructive">{apiError}</p>
				{/if}
				<div class="flex flex-col gap-2">
					<label for="edit-title" class="text-sm font-medium">Title</label>
					<Input
						id="edit-title"
						name="title"
						bind:value={$form.title}
						class={cn('h-9', $errors.title && 'border-destructive')}
						aria-invalid={$errors.title ? 'true' : undefined}
					/>
					{#if $errors.title}
						<span class="text-xs text-destructive">{$errors.title}</span>
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					<label for="edit-subtitle" class="text-sm font-medium">
						Subtitle <span class="font-normal text-muted-foreground">(Optional)</span>
					</label>
					<Input
						id="edit-subtitle"
						name="subtitle"
						bind:value={$form.subtitle}
						class={cn('h-9', $errors.subtitle && 'border-destructive')}
						aria-invalid={$errors.subtitle ? 'true' : undefined}
					/>
					{#if $errors.subtitle}
						<span class="text-xs text-destructive">{$errors.subtitle}</span>
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					<label for="edit-handle" class="text-sm font-medium">Handle</label>
					<div class="relative flex w-full items-center">
						<span class="absolute start-3 text-sm text-muted-foreground">/</span>
						<Input
							id="edit-handle"
							name="handle"
							bind:value={$form.handle}
							class={cn('h-9 pl-6', $errors.handle && 'border-destructive')}
							placeholder="product-handle"
							aria-invalid={$errors.handle ? 'true' : undefined}
						/>
					</div>
					{#if $errors.handle}
						<span class="text-xs text-destructive">{$errors.handle}</span>
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					<label for="edit-description" class="text-sm font-medium">
						Description <span class="font-normal text-muted-foreground">(Optional)</span>
					</label>
					<textarea
						id="edit-description"
						name="description"
						bind:value={$form.description}
						rows="3"
						class={cn(
							'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
							$errors.description && 'border-destructive'
						)}
						aria-invalid={$errors.description ? 'true' : undefined}
					></textarea>
					{#if $errors.description}
						<span class="text-xs text-destructive">{$errors.description}</span>
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<button
							id="edit-discountable"
							type="button"
							role="switch"
							aria-checked={$form.discountable}
							aria-label="Discountable"
							onclick={() => ($form.discountable = !$form.discountable)}
							class={cn(
								'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
								$form.discountable ? 'bg-primary' : 'bg-input'
							)}
						>
							<span
								class={cn(
									'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
									$form.discountable ? 'translate-x-5' : 'translate-x-px'
								)}
							></span>
						</button>
						<label for="edit-discountable" class="text-sm font-medium">Discountable</label>
					</div>
					<p class="text-xs text-muted-foreground">
						When unchecked, discounts will not be applied to this product.
					</p>
				</div>
			</div>
			<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={closeSheet} disabled={!!$delayed}>
					Cancel
				</Button>
				<Button type="submit" disabled={!!$delayed}>Save</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
