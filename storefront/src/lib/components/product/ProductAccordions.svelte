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

<style>
	.accordions {
		display: flex;
		flex-direction: column;
		gap: 0;
		border-top: 1px solid #eee;
		padding-top: 1rem;
	}
	.accordion {
		width: 100%;
		padding: 0.75rem 0;
		text-align: left;
		background: none;
		border: none;
		border-bottom: 1px solid #eee;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #1a1a1a;
		cursor: pointer;
	}
	.accordion-panel {
		padding: 0 0 1rem;
		font-size: 0.9375rem;
		color: #555;
		line-height: 1.6;
	}
	.accordion-panel :global(p) {
		margin: 0 0 0.5rem;
	}
</style>
