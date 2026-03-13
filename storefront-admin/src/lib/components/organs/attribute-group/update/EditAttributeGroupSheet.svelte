<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { client } from '$lib/client';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { z } from 'zod';

	const AttributeGroupUpdateSchema = z.object({
		id: z.string(),
		title: z.string().min(3, 'Title must be at least 3 characters').max(50, 'Title is too long'),
		attribute_ids: z.array(z.string()).default([]),
		required: z.boolean().default(false),
		rank: z.number().default(0)
	});

	type AttributeGroupFormData = z.infer<typeof AttributeGroupUpdateSchema>;
	type AttributeGroupItem = { id: string; title: string; attribute_ids: string[]; required: boolean; rank: number };
	type Mode = 'update' ;

	interface Props {
		group?: AttributeGroupItem | null;
		mode?: Mode;
		onSaved?: () => void | Promise<void>;
		onClosed?: () => void | Promise<void>;
	}

	let { group = null, onSaved = () => {}, onClosed = () => {} }: Props = $props();

	let open = $state(false);
	let lastGroupId = $state<string | null>(null);

	const { form, errors, enhance, delayed, message, reset } = superForm(
		defaults({ id: '', title: '', attribute_ids: [], required: false, rank: 0 }, zod4(AttributeGroupUpdateSchema)),
		{
			SPA: true,
			validators: zod4(AttributeGroupUpdateSchema),
			async onUpdate({ form }) {
				if (!form.valid) return;
				try {
					const id = form.data.id;
					await client['product-attribute-groups']({ id }).put({
						id,
						title: form.data.title.trim(),
						metadata: {
							required: form.data.required,
							rank: form.data.rank
						} as Record<string, any>,
						attributes: form.data.attribute_ids.map((attribute_id) => ({ attribute_id }))
					});
					open = false;
					await onSaved();
				} catch (e: any) {
					message.set(e?.message || 'Failed to update attribute group');
				}
			}
		}
	);

	$effect(() => {
		const groupId = group?.id ?? null;
		if (!groupId || lastGroupId === groupId) return;
		lastGroupId = groupId;
		reset({
			data: {
				id: group?.id ?? '',
				title: group?.title ?? '',
				attribute_ids: group?.attribute_ids ?? [] as unknown as string[],
				required: group?.required ?? false as boolean,
				rank: group?.rank ?? 0 as number
			}
		});
		message.set('');
		open = true;
	});

	$effect(() => {
		if (open) return;
		if (!lastGroupId) return;
		lastGroupId = null;
		if (!$delayed) {
			onClosed();
		}
	});

	async function closeSheet() {
		if ($delayed) return;
		open = false;
		message.set('');
	}
</script>

<Sheet.Root bind:open={open}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form method="POST" use:enhance class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Attribute Group</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the attribute group title.</p>
				{#if $message}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{$message}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-title"
							name="title"
							bind:value={$form.title}
							placeholder="e.g. Specifications"
							aria-invalid={$errors.title ? 'true' : undefined}
							class={cn('h-9', $errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
						{/if}
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeSheet}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
