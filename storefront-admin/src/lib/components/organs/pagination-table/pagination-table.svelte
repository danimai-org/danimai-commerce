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
		children,
	}: {
		searchQuery?: string;
		searchPlaceholder?: string;
		showFilter?: boolean;
		showSort?: boolean;
		showToolbar?: boolean;
		children?: import('svelte').Snippet;
	} = $props();

	function debounce(func: (...args: string[]) => void, delay = 300) {
    let timer: NodeJS.Timeout;
    return (...args: string[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(undefined, args), delay);
    };
  }

  const debouncedSearch = debounce((search: string) => {
    searchQuery = search;
  }, 300);
</script>

{#if showToolbar}
<div class="mb-6 flex flex-col gap-4">
	<div class="flex flex-wrap items-center justify-between gap-2">
		{#if showFilter}
			<Button variant="outline" size="sm" class="rounded-md">
				<SlidersHorizontal class="mr-1.5 size-4" />
				Add filter
			</Button>
		{:else}
			<div></div>
		{/if}
		<div class="flex items-center gap-2">
			<div class="relative w-64">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder={searchPlaceholder}
					class="h-9 rounded-md pl-9"
					bind:value={searchQuery}
					// onchange={(e) => debouncedSearch((e.target as HTMLInputElement).value)}
				/>
			</div>
			{#if showSort}
				<button
					type="button"
					class="flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
