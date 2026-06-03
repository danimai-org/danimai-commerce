<script lang="ts">
	import { cn } from '$lib/utils/cn';

	const searchClearBtn =
		'flex size-8 shrink-0 items-center justify-center rounded-md text-[#888] transition-colors hover:bg-[#f5f5f5] hover:text-[#1a1a1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d2d2d]';

	export type ComboboxOption = { id: string; value: string };

	type Props = {
		options: ComboboxOption[];
		value?: string;
		onValueChange?: (value: string) => void;
		onSearchChange?: (query: string) => void;
		onOpen?: () => void;
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
		remoteOptions?: boolean;
		searchDebounceMs?: number;
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
		remoteOptions = false,
		searchDebounceMs,
	}: Props = $props();

	const resolvedSearchDebounceMs = $derived(
		searchDebounceMs ?? (onSearchChange ? 300 : 0)
	);

	let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

	function emitSearchChange(query: string) {
		if (!onSearchChange) return;
		const delay = resolvedSearchDebounceMs;
		if (delay <= 0) {
			onSearchChange(query);
			return;
		}
		clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => {
			searchDebounceTimer = undefined;
			onSearchChange(query);
		}, delay);
	}

	const listboxId = $derived(
		propId ? `${propId}-listbox` : `combobox-listbox-${Math.random().toString(36).slice(2, 9)}`
	);
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
		opts.filter(
			(o) => !query.trim() || o.value.toLowerCase().includes(query.trim().toLowerCase())
		);

	const filteredOptions = $derived(
		remoteOptions ? options : (filterFn ?? defaultFilter)(options, input)
	);

	const selectedLabel = $derived(
		value ? (options.find((o) => o.id === value)?.value ?? '') : ''
	);

	const displayValue = $derived(
		open ? input : value && selectedLabel ? selectedLabel : input
	);

	let blurSchedule: ReturnType<typeof setTimeout> | undefined;

	function resetSearchQuery() {
		input = '';
		emitSearchChange('');
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
		'combobox-trigger relative flex min-h-[2.75rem] w-full items-center rounded-md border border-[#ddd] bg-white px-3 py-[0.65rem] text-[0.9375rem] text-[#1a1a1a] shadow-none outline-none focus-within:border-[#2d2d2d]',
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
		class="h-full min-w-0 flex-1 border-0 bg-transparent py-0 pr-1 pl-0 text-[0.9375rem] text-[#1a1a1a] outline-none placeholder:text-[#999]"
		placeholder={open ? 'Type to search…' : value ? '' : placeholder}
		value={displayValue}
		{disabled}
		onfocus={() => {
			if (disabled) return;
			notifyFirstOpen();
			setDropdownOpen(true);
		}}
		oninput={(e) => {
			notifyFirstOpen();
			setDropdownOpen(true);
			input = (e.currentTarget as HTMLInputElement).value;
			emitSearchChange(input);
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
			class="flex shrink-0 items-center justify-center rounded p-1 text-[#888] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
			aria-label="Clear selection"
			onclick={clear}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			</svg>
		</button>
	{:else if !open}
		<span class="combobox-chevron pointer-events-none shrink-0 text-[#1a1a1a]" aria-hidden="true">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m6 9 6 6 6-6" />
			</svg>
		</span>
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
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="opacity-70"
				aria-hidden="true"
			>
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			</svg>
		</button>
	{/if}
	{#if open}
		<ul
			id={listboxId}
			role="listbox"
			class={cn(
				'combobox-listbox absolute top-full left-0 z-50 mt-1 max-h-48 w-full min-w-0 overflow-auto rounded-md border border-[#ddd] bg-white py-1 text-[#1a1a1a] shadow-md',
				listboxClass
			)}
			onpointerdown={listPointerDown}
		>
			{#if loading}
				<li class="flex items-center gap-2 px-3 py-1.5 text-sm text-[#888]">
					<span
						class="inline-block size-3 animate-spin rounded-full border-2 border-[#ddd] border-t-[#2d2d2d]"
					></span>
					Searching…
				</li>
			{:else}
				{#each filteredOptions as option (option.id)}
					<li role="option" aria-selected={value === option.id}>
						<button
							type="button"
							class="w-full cursor-pointer px-3 py-1.5 text-left text-[0.9375rem] hover:bg-[#f5f5f5]"
							onclick={(e) => {
								e.stopPropagation();
								select(option.id);
							}}
							onkeydown={(e) =>
								e.key === 'Enter' && (e.preventDefault(), select(option.id))}
						>
							{option.value}
						</button>
					</li>
				{/each}
				{#if filteredOptions.length === 0}
					<li class="px-3 py-1.5 text-[0.9375rem] text-[#888]">{emptyMessage}</li>
				{/if}
			{/if}
		</ul>
	{/if}
</div>
