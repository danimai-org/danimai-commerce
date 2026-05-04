<script lang="ts">
	export type InfoBlock = { title: string; text: string };

	let {
		blocks = [
			{
				title: 'Free Shipping',
				text: 'Enjoy free standard shipping on all orders. Express shipping available at an additional cost.'
			},
			{
				title: 'Hassle-Free Returns',
				text: "Not completely satisfied? We'll gladly offer you a refund within 30 days of your purchase. Return shipping is not included."
			}
		]
	}: {
		blocks?: InfoBlock[];
	} = $props();
</script>

<div class="product-info-blocks">
	{#each blocks as block}
		<div class="info-block">
			<h3>{block.title}</h3>
			<p>{block.text}</p>
		</div>
	{/each}
</div>
