<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';

	export type ComboboxOption = { id: string; value: string };

	type Props = {
		options: ComboboxOption[];
		value?: string;
		placeholder?: string;
		id?: string;
		disabled?: boolean;
		emptyMessage?: string;
		class?: string;
		triggerClass?: string;
		listboxClass?: string;
		filterFn?: (options: ComboboxOption[], query: string) => ComboboxOption[];
	};

	let {
		options = [],
		value = $bindable(''),
		placeholder = 'Select…',
		id: propId,
		disabled = false,
		emptyMessage = 'No results found',
		class: className = '',
		triggerClass = '',
		listboxClass = '',
		filterFn,
	}: Props = $props();

	const listboxId = $derived(propId ? `${propId}-listbox` : `combobox-listbox-${Math.random().toString(36).slice(2, 9)}`);
	const comboboxId = $derived(propId ?? listboxId.replace('-listbox', ''));

	let open = $state(false);
	let input = $state('');

	const defaultFilter = (opts: ComboboxOption[], query: string) =>
		opts.filter((o) => !query.trim() || o.value.toLowerCase().includes(query.trim().toLowerCase()));

	const filteredOptions = $derived((filterFn ?? defaultFilter)(options, input));

	const selectedLabel = $derived(value ? options.find((o) => o.id === value)?.value ?? '' : '');

	const displayValue = $derived(open ? input : value ? selectedLabel : input);

	function select(optionId: string) {
		value = optionId;
		input = '';
		open = false;
	}

	function clear(e: MouseEvent) {
		e.stopPropagation();
		value = '';
		input = '';
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
			input = '';
		}
		if (e.key === 'Enter' && open) {
			e.preventDefault();
			if (filteredOptions.length > 0) select(filteredOptions[0].id);
		}
	}

	function handleFocusout(e: FocusEvent) {
		if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) {
			open = false;
			input = '';
		}
	}
</script>

<div
	class={cn(
		'relative flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-within:ring-2 focus-within:ring-ring',
		disabled && 'pointer-events-none opacity-50',
		triggerClass,
		className
	)}
	role="combobox"
	aria-expanded={open}
	aria-haspopup="listbox"
	aria-controls={listboxId}
	id={comboboxId}
	aria-disabled={disabled}
	tabindex={disabled ? -1 : 0}
	onclick={() => !disabled && (open = true)}
	onfocusout={handleFocusout}
	onkeydown={handleKeydown}
>
	<input
		type="text"
		class="h-full min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm text-foreground outline-none placeholder:text-muted-foreground"
		placeholder={open ? 'Type to search…' : value ? '' : placeholder}
		value={displayValue}
		disabled={disabled}
		oninput={(e) => {
			open = true;
			input = (e.currentTarget as HTMLInputElement).value;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				open = false;
				input = '';
			}
			if (e.key === 'Enter' && open) {
				e.preventDefault();
				if (filteredOptions.length > 0) select(filteredOptions[0].id);
			}
		}}
	/>
	{#if value && !disabled}
		<button
			type="button"
			class="flex shrink-0 items-center justify-center rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
			aria-label="Clear selection"
			onclick={clear}
		>
			<X class="size-4" />
		</button>
	{/if}
	{#if open}
		<ul
			id={listboxId}
			role="listbox"
			class={cn(
				'absolute top-full left-0 z-50 mt-1 max-h-48 w-full min-w-0 overflow-auto rounded-md border border-input bg-popover py-1 text-popover-foreground shadow-md',
				listboxClass
			)}
		>
			{#each filteredOptions as option (option.id)}
				<li role="option" aria-selected={value === option.id}>
					<button
						type="button"
						class="w-full cursor-pointer px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
						onclick={(e) => {
							e.stopPropagation();
							select(option.id);
						}}
						onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), select(option.id))}
					>
						{option.value}
					</button>
				</li>
			{/each}
			{#if filteredOptions.length === 0}
				<li class="px-3 py-1.5 text-sm text-muted-foreground">{emptyMessage}</li>
			{/if}
		</ul>
	{/if}
</div>
