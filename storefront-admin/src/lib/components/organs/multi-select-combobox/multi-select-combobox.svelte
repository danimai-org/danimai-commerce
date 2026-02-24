<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';

	export type MultiSelectOption = { id: string; value: string };

	type Props = {
		options: MultiSelectOption[];
		value?: string[];
		placeholder?: string;
		id?: string;
		disabled?: boolean;
		emptyMessage?: string;
		class?: string;
		triggerClass?: string;
		listboxClass?: string;
		chipsClass?: string;
		filterFn?: (options: MultiSelectOption[], query: string) => MultiSelectOption[];
		/** Called when the dropdown is first opened (e.g. for lazy-loading options). */
		onOpen?: () => void;
	};

	let {
		options = [],
		value = $bindable([]),
		placeholder = 'Search…',
		id: propId,
		disabled = false,
		emptyMessage = 'No results found.',
		class: className = '',
		triggerClass = '',
		listboxClass = '',
		chipsClass = '',
		filterFn,
		onOpen,
	}: Props = $props();

	const listboxId = $derived(propId ? `${propId}-listbox` : `multi-select-listbox-${Math.random().toString(36).slice(2, 9)}`);
	const inputId = $derived(propId ? `${propId}-search` : undefined);

	let open = $state(false);
	let input = $state('');
	let hasOpened = $state(false);

	const defaultFilter = (opts: MultiSelectOption[], query: string) =>
		opts.filter((o) => !query.trim() || o.value.toLowerCase().includes(query.trim().toLowerCase()));

	const filteredOptions = $derived((filterFn ?? defaultFilter)(options, input));

	const selectedOptions = $derived(value.map((id) => options.find((o) => o.id === id)).filter(Boolean) as MultiSelectOption[]);

	function toggle(id: string) {
		if (value.includes(id)) {
			value = value.filter((x) => x !== id);
		} else {
			value = [...value, id];
		}
	}

	function remove(id: string) {
		value = value.filter((x) => x !== id);
	}

	function handleFocusout(e: FocusEvent) {
		if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) {
			open = false;
		}
	}
</script>

<div class={cn('flex flex-col gap-3', className)}>
	<div
		class={cn(
			'relative flex h-9 w-full rounded-md border border-input bg-background text-sm shadow-xs focus-within:ring-2 focus-within:ring-ring',
			disabled && 'pointer-events-none opacity-50',
			triggerClass
		)}
		role="combobox"
		aria-expanded={open}
		aria-haspopup="listbox"
		aria-controls={listboxId}
		tabindex={disabled ? -1 : 0}
		onclick={(e) => {
			if (disabled) return;
			if (e.isTrusted && !hasOpened) {
				hasOpened = true;
				onOpen?.();
			}
			open = true;
		}}
		onfocusout={handleFocusout}
		onkeydown={(e) => {
			if (e.key === 'Escape') open = false;
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				if (e.isTrusted && !hasOpened) {
					hasOpened = true;
					onOpen?.();
				}
				open = true;
			}
		}}
	>
		<Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
		<input
			type="text"
			id={inputId}
			class="h-full min-w-0 flex-1 border-0 bg-transparent py-1 pl-9 pr-3 outline-none placeholder:text-muted-foreground"
			placeholder={placeholder}
			bind:value={input}
			disabled={disabled}
			onkeydown={(e) => e.key === 'Escape' && (open = false)}
		/>
		{#if open}
			<ul
				id={listboxId}
				role="listbox"
				class={cn(
					'absolute top-full left-0 z-50 mt-1 max-h-48 w-full min-w-0 overflow-auto rounded-md border border-input bg-popover py-1 text-popover-foreground shadow-md',
					listboxClass
				)}
			>
				{#if filteredOptions.length === 0}
					<li class="px-3 py-1.5 text-sm text-muted-foreground">{emptyMessage}</li>
				{:else}
					{#each filteredOptions as option (option.id)}
						<li role="option" aria-selected={value.includes(option.id)}>
							<button
								type="button"
								class="flex w-full cursor-pointer items-center gap-3 px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
								onclick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									toggle(option.id);
								}}
							>
								<input
									type="checkbox"
									class="size-4 rounded border-input"
									checked={value.includes(option.id)}
									tabindex="-1"
									readonly
								/>
								<span class="min-w-0 flex-1 truncate">{option.value}</span>
							</button>
						</li>
					{/each}
				{/if}
			</ul>
		{/if}
	</div>
	{#if selectedOptions.length > 0}
		<div class={cn('w-full overflow-hidden rounded-md border', chipsClass)}>
			<table class="w-full text-sm">
				<thead class="border-b bg-muted/50">
					<tr>
						<th class="px-3 py-2 text-left font-medium">Name</th>
						<th class="w-10 px-3 py-2 text-right font-medium">Remove</th>
					</tr>
				</thead>
				<tbody>
					{#each selectedOptions as option (option.id)}
						<tr class="border-b last:border-0 hover:bg-muted/30">
							<td class="px-3 py-2">
								<span class="min-w-0 truncate">{option.value}</span>
							</td>
							<td class="px-3 py-2 text-right">
								<button
									type="button"
									class="inline-flex rounded p-0.5 hover:bg-muted-foreground/20"
									aria-label="Remove {option.value}"
									onclick={() => remove(option.id)}
									disabled={disabled}
								>
									<X class="size-3" />
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
