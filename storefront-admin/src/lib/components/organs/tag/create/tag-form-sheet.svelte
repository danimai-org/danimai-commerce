
<script lang="ts">
    import { Button } from '$lib/components/ui/button/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import * as Sheet from '$lib/components/ui/sheet/index.js';
    import { tagSchema } from "./schema.ts";
    import { superForm, defaults } from 'sveltekit-superforms';
    import { zod } from 'sveltekit-superforms/adapters';
    import { cn } from '$lib/utils.js';
    import { client } from '$lib/client.js';

    let {
        open = $bindable(false),
        mode = 'create',
        tag = null,
        onSuccess = () => {}
    } = $props();

   
    const { form, errors, enhance, delayed, message, reset } = superForm(
        defaults(tag ?? { value: '' }, zod(tagSchema as any)), 
        {
            SPA: true, 
            validators: zod(tagSchema as any),
            async onUpdate({ form }) {
                if (!form.valid) return;

                try {
                    if (mode === 'edit' && tag) {
                        await client['product-tags']({ id: tag.id }).put(form.data);
                    } else {
                        await client['product-tags'].post(form.data);
                    }
                    open = false;
                    onSuccess();
                } catch (e) {
                   
                    message.set(e instanceof Error ? e.message : 'An error occurred');
                }
            }
        }
    );

    $effect(() => {
        if (open) {
            reset({ data: mode === 'edit' && tag ? { value: tag.value } : { value: '' } });
        }
    });

    const title = $derived(mode === 'edit' ? 'Edit Tag' : 'Create Tag');
    const submitLabel = $derived(
        $delayed ? (mode === 'edit' ? 'Saving…' : 'Creating…') : (mode === 'edit' ? 'Save' : 'Create')
    );
</script>

<Sheet.Root bind:open>
    <Sheet.Content side="right" class="w-full max-w-md">
        <form method="POST" use:enhance class="flex h-full flex-col">
            <div class="flex-1 overflow-auto p-6 pt-12">
                <h2 class="text-lg font-semibold">{title}</h2>
                <p class="mt-1 text-sm text-muted-foreground">
                    {mode === 'edit' ? 'Update the tag value.' : 'Add a new product tag.'}
                </p>

                {#if $message}
                    <div class="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {$message}
                    </div>
                {/if}

                <div class="mt-6 flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="value" class="text-sm font-medium">Value</label>
                        <Input
                            id="value"
                            name="value"
                            bind:value={$form.value}
                            placeholder="e.g. sale, new-arrival"
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