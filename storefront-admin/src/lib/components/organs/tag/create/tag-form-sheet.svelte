

<script lang="ts">
    import { Button } from '$lib/components/ui/button/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import * as Sheet from '$lib/components/ui/sheet/index.js';
    import { superForm, defaults } from 'sveltekit-superforms';
    import { zod4 } from 'sveltekit-superforms/adapters'; 
    import { cn } from '$lib/utils.js';
    import { client } from '$lib/client.js';
    import { z } from 'zod';
    import { toast, Toaster } from 'svelte-sonner';
    const TagCreateSchema = z.object({
        value: z.string().min(3, "Value must be at least 3 characters").max(50, "Tag is too long"),
    });

    type TagFormData = z.infer<typeof TagCreateSchema>;
    type TagItem = { id: string; value: string };
    type Mode = 'create';

    let {
        open = $bindable(false),
        mode = 'create',
        tag = null,
        onSuccess = () => {}
    }: {
        open?: boolean;
        mode?: Mode;
        tag?: TagItem | null;
        onSuccess?: () => void | Promise<void>;
    } = $props();



    const { form, errors, enhance, delayed, message, reset, submitting } = superForm(
        defaults({ value: '' }, zod4(TagCreateSchema)),
        {
            SPA: true,
            validators: zod4(TagCreateSchema),
            async onUpdate({ form }) {
                if (!form.valid) return;

                try {
                    await client['product-tags'].post(form.data);
                    toast.success('Tag created successfully');
                    open = false;
                    onSuccess();
                } catch (e: any) {
                    const errorMsg = e?.message || 'An unexpected error occurred';
                    message.set(errorMsg);
                    toast.error(errorMsg);
                }
            }
        }
    );
    $effect(() => {
        if (open) {
            reset({ 
                data: { value: '' } 
            });
        }
    });

    const title = $derived('Create Tag');
    const submitLabel = $derived(
        $delayed 
            ? 'Creating...' 
            : 'Create Tag'
    );
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open>
    <Sheet.Content side="right" class="w-full max-w-md">
        <form method="POST" use:enhance class="flex h-full flex-col">
            <div class="flex-1 overflow-auto p-6 pt-12">
                <h2 class="text-lg font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new product tag to your catalog.
				</p>
				
                <div class="mt-6 flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="value" class="text-sm font-medium">Tag Name</label>
                        <Input
                            id="value"
                            name="value"
                            bind:value={$form.value}
                            placeholder="e.g. sale, new-arrival"
                            aria-invalid={$errors.value ? 'true' : undefined}
                            class={cn($errors.value && 'border-destructive')}
                        />
                        {#if $errors.value}
                            <span class="text-xs text-destructive">{$errors.value}</span>
                        {/if}
                    </div>
                </div>
            </div>

            <div class="flex justify-end gap-2 border-t p-4">
                <Button variant="outline" type="button" onclick={() => (open = false)}>
                    Cancel
                </Button>
                <Button type="submit" disabled={$delayed}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    </Sheet.Content>
</Sheet.Root>