<script lang="ts">
	export type AccordionItem = { key: string; title: string; content: string };

	let {
		items = [],
		defaultOpenKey = null as string | null
	}: {
		items: AccordionItem[];
		defaultOpenKey?: string | null;
	} = $props();

	let openAccordion = $state<string | null>(null);
	$effect(() => {
		const key = defaultOpenKey;
		if (key != null && items.length > 0 && openAccordion === null) {
			openAccordion = key;
		}
	});

	function toggle(key: string) {
		openAccordion = openAccordion === key ? null : key;
	}
</script>

<div class="accordions">
	{#each items as item}
		<button
			type="button"
			class="accordion"
			class:open={openAccordion === item.key}
			onclick={() => toggle(item.key)}
			aria-expanded={openAccordion === item.key}
		>
			<span class="accordion-title">{item.title}</span>
			<svg
				class="accordion-arrow"
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
				<polyline points="6 9 12 15 18 9" />
			</svg>
		</button>
		{#if openAccordion === item.key}
			<div class="accordion-panel">
				{@html item.content}
			</div>
		{/if}
	{/each}
</div>
