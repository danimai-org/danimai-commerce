<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';

	let {
		searchQuery = $bindable(''),
		searchPlaceholder = 'Search',
		showFilter = true,
		showSort = true,
		showToolbar = true,
		children
	}: {
		searchQuery?: string;
		searchPlaceholder?: string;
		showFilter?: boolean;
		showSort?: boolean;
		showToolbar?: boolean;
		children?: import('svelte').Snippet;
	} = $props();
</script>

{#if showToolbar}
	<div class="mb-6 flex min-w-0 w-full flex-col gap-4">
		<div class="flex min-w-0 flex-wrap items-center gap-2 sm:justify-between">
			{#if showFilter}
				<Button
					variant="outline"
					size="sm"
					class="h-9 shrink-0 rounded-md max-sm:w-9 max-sm:justify-center max-sm:gap-0 max-sm:px-0 sm:min-h-9"
					aria-label="Add filter"
					title="Add filter"
				>
					<SlidersHorizontal class="size-4 shrink-0 sm:mr-1.5" />
					<span class="hidden sm:inline">Add filter</span>
				</Button>
			{:else}
				<div class="hidden sm:block"></div>
			{/if}
			<div class="flex min-w-0 flex-1 items-center gap-2 sm:w-auto sm:flex-none">
				<div class="relative min-w-0 w-full flex-1 sm:w-64 sm:flex-none">
					<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder={searchPlaceholder}
						class="h-9 w-full min-w-0 rounded-md pl-9"
						bind:value={searchQuery}
					/>
				</div>
				{#if showSort}
					<button
						type="button"
						class="flex size-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Sort"
					>
						<ArrowUpDown class="size-4" />
						<span class="sr-only">Sort</span>
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if children}
	{@render children()}
{/if}
