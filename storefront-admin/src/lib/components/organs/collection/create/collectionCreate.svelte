
 <script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { client} from '$lib/client.js';
	import { cn } from '$lib/utils.js';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters'; 
	import { z } from 'zod';
	import { toast, Toaster } from 'svelte-sonner';
	import slugify from 'slugify';


	const CollectionCreateSchema = z.object({
		title: z.string().min(3, "Title must be at least 3 characters").max(50, "Title is too long"),
		handle: z
			.string()
			.max(100, 'Handle is too long')
			.regex(/^[a-z0-9-]*$/, 'Use lowercase letters, numbers, and hyphens only')
			.optional()
	});

	let {
		open = $bindable(false),
		onSuccess = () => {}
	}: {
		open?: boolean;
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
		defaults({ title: '', handle: '' }, zod4(CollectionCreateSchema)),
		{
			SPA: true,
			validators: zod4(CollectionCreateSchema),
			async onUpdate({ form }) {
				if (!form.valid) return;
				try {
					const title = form.data.title.trim();
					const rawHandle = (form.data.handle ?? '').trim();
					const handle = slugify(rawHandle || title, { lower: true, strict: true });
					const res = await client['collections'].post({ title, handle });
					if (res.error) {
						const errorMsg = res.error.value.message;
						message.set(errorMsg);
						return;
					}
					toast.success('Collection has been created successfully');
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
				data: { title: '', handle: '' } 
			});
		}
	});	
		const sheetTitle = $derived('Create collection');
	const subtitle = $derived(
		'Add a new collection.'
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
						<label for="collection-title" class="text-sm font-medium">Title</label>
						<Input
							id="collection-title"	
							name="title"
							bind:value={$form.title}
							placeholder="e.g. Collection Title"
							aria-invalid={$errors.title ? 'true' : undefined}
							class={cn($errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="collection-handle" class="text-sm font-medium">Handle</label>
						<Input
							id="collection-handle"
							name="handle"
							bind:value={$form.handle}	
							placeholder="e.g. collection-title"
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
					{$delayed ? 'Creating…' : 'Create'}
				
				</Button>
			</div>
		</form>
	</Sheet.Content>
	</Sheet.Root>
	
