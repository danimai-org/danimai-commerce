
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


	const AttributeCreateSchema = z.object({
			title: z.string().min(3, "Title must be at least 3 characters").max(50, "Title is too long"),
			type: z.enum(['string', 'number', 'boolean', 'date']),
	});

	type AttributeFormData = z.infer<typeof AttributeCreateSchema>;
	type AttributeItem = { id: string; title: string; type: string };
	type Mode = 'create' ;

	let {
		open = $bindable(false),
		mode = 'create',
		attribute = null as AttributeItem | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: Mode;
		attribute?: AttributeItem | null;
		onSuccess?: () => void;
	} = $props();

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
		defaults({ title: '', type: 'string' }, zod4(AttributeCreateSchema)),
		{
			SPA: true,
			validators: zod4(AttributeCreateSchema),
			async onUpdate({ form }) {
				if (!form.valid) return;
				try {
					await client['product-attributes'].post({ title: form.data.title.trim(), type: form.data.type });
					toast.success('Attribute has been created successfully');
					open = false;
					onSuccess();
				} catch (e: any) {
					const errorMsg = e?.message || 'An unexpected error occurred';
					toast.error(errorMsg);
					error = errorMsg;
				}
			},
		}
	);		
	$effect(() => {
		if (open) {
			reset({ 
				data: { title: '', type: 'string' as const } 
			});
		}
	});	
	const sheetTitle = $derived('Create attribute');
	const subtitle = $derived(
		'Add a new attribute.'
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
						<label for="attribute-title" class="text-sm font-medium">Title</label>
						<Input
							id="attribute-title"
							name="title"
							bind:value={$form.title}
							placeholder="e.g. Color, Size"
							aria-invalid={$errors.title ? 'true' : undefined}
							class={cn($errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="attribute-type" class="text-sm font-medium">Type</label>
						<Input
							id="attribute-type"
							name="type"
							bind:value={$form.type}
							placeholder="e.g. string, number, boolean, date"
							aria-invalid={$errors.type ? 'true' : undefined}
							class={cn($errors.type && 'border-destructive')}
							/>
							{#if $errors.type}
							<span class="text-xs text-destructive">{$errors.type}</span>
						{/if}
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
	
