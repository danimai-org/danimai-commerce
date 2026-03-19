<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';

	interface Props {
		open?: boolean;
		regionId?: string;
		title?: string;
		onSave?: (data: { name: string; code: string; rate: string }) => void;
	}

	let { open = $bindable(false), regionId: _regionId, title = 'Edit Tax Rate', onSave }: Props = $props();

	let name = $state('');
	let code = $state('');
	let rate = $state('0.00');

	function resetForm() {
		name = '';
		code = '';
		rate = '0.00';
	}

	function handleSave() {
		onSave?.({ name, code, rate });
		resetForm();
		open = false;
	}

	function handleCancel() {
		resetForm();
		open = false;
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{title}</h2>

				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="tr-rate-name" class="text-sm font-medium">Name</label>
						<Input id="tr-rate-name" bind:value={name} class="h-9" />
					</div>
					<div class="flex flex-col gap-2">
						<label for="tr-rate-code" class="text-sm font-medium">Tax code</label>
						<Input id="tr-rate-code" bind:value={code} class="h-9" />
					</div>
					<div class="flex flex-col gap-2">
						<label for="tr-rate-value" class="text-sm font-medium">Tax rate</label>
						<div class="flex items-center gap-0">
							<span
								class="flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-2.5 text-sm text-muted-foreground"
							>
								%
							</span>
							<Input
								id="tr-rate-value"
								bind:value={rate}
								class="h-9 rounded-l-none"
								type="number"
								step="0.01"
								min="0"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={handleCancel}>Cancel</Button>
				<Button onclick={handleSave}>Save</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
