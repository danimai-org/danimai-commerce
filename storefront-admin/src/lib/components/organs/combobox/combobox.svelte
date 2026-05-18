<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';

	const searchClearBtn =
		'flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

	export type ComboboxOption = { id: string; value: string };

	type Props = {
		options: ComboboxOption[];
		value?: string;
		onValueChange?: (value: string) => void;
		onSearchChange?: (query: string) => void;
		/** Lazy-load hooks: first open (click / type) per mounted instance */
		onOpen?: () => void;
		/** Fires whenever the dropdown opens or closes */
		onOpenChange?: (open: boolean) => void;
		placeholder?: string;
		id?: string;
		disabled?: boolean;
		loading?: boolean;
		emptyMessage?: string;
		class?: string;
		triggerClass?: string;
		listboxClass?: string;
		filterFn?: (options: ComboboxOption[], query: string) => ComboboxOption[];
	};

	let {
		options = [],
		value = $bindable(''),
		onValueChange,
		onSearchChange,
		onOpen,
		onOpenChange,
		placeholder = 'Select…',
		id: propId,
		disabled = false,
		loading = false,
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
	let hasOpened = $state(false);

	function setDropdownOpen(next: boolean) {
		if (open === next) return;
		open = next;
		onOpenChange?.(next);
	}

	function notifyFirstOpen() {
		if (!hasOpened) {
			hasOpened = true;
			onOpen?.();
		}
	}

	const defaultFilter = (opts: ComboboxOption[], query: string) =>
		opts.filter((o) => !query.trim() || o.value.toLowerCase().includes(query.trim().toLowerCase()));

	const filteredOptions = $derived((filterFn ?? defaultFilter)(options, input));

	const selectedLabel = $derived(value ? options.find((o) => o.id === value)?.value ?? '' : '');

	/** Closed + selection: show label; otherwise keep draft search. Open: always show draft. */
	const displayValue = $derived(
		open ? input : value && selectedLabel ? selectedLabel : input
	);

	let blurSchedule: ReturnType<typeof setTimeout> | undefined;

	function resetSearchQuery() {
		input = '';
		onSearchChange?.('');
	}

	function select(optionId: string) {
		value = optionId;
		onValueChange?.(optionId);
		resetSearchQuery();
		setDropdownOpen(false);
	}

	function clear(e: MouseEvent) {
		e.stopPropagation();
		value = '';
		onValueChange?.('');
		resetSearchQuery();
		setDropdownOpen(false);
	}

	function clearSearchOnly(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		resetSearchQuery();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			setDropdownOpen(false);
		}
		if (e.key === 'Enter' && open) {
			e.preventDefault();
			if (filteredOptions.length > 0) select(filteredOptions[0].id);
		}
	}

	function handleFocusout(e: FocusEvent) {
		const root = e.currentTarget as HTMLElement;
		if (blurSchedule) clearTimeout(blurSchedule);
		blurSchedule = setTimeout(() => {
			blurSchedule = undefined;
			if (!root.contains(document.activeElement)) {
				setDropdownOpen(false);
			}
		}, 0);
	}

	function listPointerDown(e: PointerEvent) {
		e.preventDefault();
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
	onclick={() => {
		if (disabled) return;
		notifyFirstOpen();
		setDropdownOpen(true);
	}}
	onfocusout={handleFocusout}
	onkeydown={handleKeydown}
>
	<input
		type="text"
		class="h-full min-w-0 flex-1 border-0 bg-transparent py-0 pr-1 pl-0 text-sm text-foreground outline-none placeholder:text-muted-foreground"
		placeholder={open ? 'Type to search…' : value ? '' : placeholder}
		value={displayValue}
		disabled={disabled}
		onfocus={() => {
			if (disabled) return;
			notifyFirstOpen();
			setDropdownOpen(true);
		}}
		oninput={(e) => {
			notifyFirstOpen();
			setDropdownOpen(true);
			input = (e.currentTarget as HTMLInputElement).value;
			onSearchChange?.(input);
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				setDropdownOpen(false);
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
	{#if open && input.trim() && !disabled}
		<button
			type="button"
			class={searchClearBtn}
			aria-label="Clear search"
			onpointerdown={(e) => {
				e.preventDefault();
				e.stopPropagation();
			}}
			onclick={clearSearchOnly}
		>
			<X class="size-4 opacity-70" aria-hidden="true" />
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
			onpointerdown={listPointerDown}
		>
			{#if loading}
				<li class="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
					<span class="inline-block size-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"></span>
					Searching…
				</li>
			{:else}
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
			{/if}
		</ul>
	{/if}
</div>
