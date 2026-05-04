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
			onclick={() => toggle(item.key)}
			aria-expanded={openAccordion === item.key}
		>
			{item.title}
		</button>
		{#if openAccordion === item.key}
			<div class="accordion-panel">
				{@html item.content}
			</div>
		{/if}
	{/each}
</div>
