<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {client} from '$lib/client.js';
	import { cn } from '$lib/utils.js';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters'; 
	import { z } from 'zod';
	import { toast, Toaster } from 'svelte-sonner';
	import slugify from 'slugify';


	const CategoryCreateSchema = z.object({
		name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name is too long"),
		handle: z
			.string()
			.max(100, 'Handle is too long')
			.regex(/^[a-z0-9-]*$/, 'Use lowercase letters, numbers, and hyphens only')
			.optional()
	});

	
	let { open = $bindable(false), onSuccess = () => {} }: { open?: boolean; onSuccess?: () => void } =
		$props();

	let error = $state<string | null>(null);

	$effect(() => {
		if (open) {
			error = null;
		}
	});

	function close() {
		if (!$delayed) open = false;
	}
	const { form, errors, enhance, delayed, message, reset } = superForm(
		defaults({ name: '', handle: '' }, zod4(CategoryCreateSchema)),
		{
			SPA: true,
			validators: zod4(CategoryCreateSchema),
			async onUpdate({ form }) {
				if (!form.valid) return;
				try {
					const name = form.data.name.trim();
					const rawHandle = (form.data.handle ?? '').trim();
					const handle = slugify(rawHandle || name, { lower: true, strict: true });
					const res = await client['product-categories'].post({
						value: name,
						metadata: { handle } as Record<string, string>
					});
					if (res.error) {
						const errorMsg = res.error.value.message;
						message.set(errorMsg);
						
						return;
					}
					message.set('Category has been created successfully');
					toast.success('Category has been created successfully');
					open = false;
					onSuccess();
				} catch (e: any) {
					const errorMsg = e?.message || 'An unexpected error occurred';
					message.set(errorMsg);
					toast.error(errorMsg);
					return;
				}
			},
		}
	);		
	$effect(() => {
		if (open) {
			reset({ 
				data: { name: '', handle: '' } 
			});
		}
	});	
	const sheetTitle = $derived('Create category');
	const subtitle = $derived(
		'Add a new category.'
	);
	const submitLabel = $derived(
		$delayed ? 'Creating…' : 'Create'
	);
</script>
<Toaster richColors position="top-center" />	
<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form method="POST" use:enhance class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{sheetTitle}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{subtitle}
				</p>
				{#if error ?? $message}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error ?? $message}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="category-name" class="text-sm font-medium">Name</label>
						<Input
							id="category-name"
							name="name"
							bind:value={$form.name}
							placeholder="e.g. Category Name"
							aria-invalid={$errors.name ? 'true' : undefined}
							class={cn($errors.name && 'border-destructive')}
						/>
						{#if $errors.name}
							<span class="text-xs text-destructive">{$errors.name}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="category-handle" class="text-sm font-medium">Handle</label>
						<Input
							id="category-handle"
							name="handle"
							bind:value={$form.handle}
							placeholder="e.g. category-name"
							aria-invalid={$errors.handle ? 'true' : undefined}
							class={cn($errors.handle && 'border-destructive')}
							/>
							{#if $errors.handle}
							<span class="text-xs text-destructive">{$errors.handle}</span>
						{/if}
							
						<p class="text-xs text-muted-foreground">
							Shown in URLs; use lowercase and hyphens. A leading "/" will be added when displayed.
						</p>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{submitLabel}
				</Button>
			</div>
		</form>
	</Sheet.Content>
	</Sheet.Root>
	
