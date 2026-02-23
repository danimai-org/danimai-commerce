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

<style>
	.product-info-blocks {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid #eee;
	}
	.info-block h3 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: #1a1a1a;
	}
	.info-block p {
		font-size: 0.9375rem;
		color: #555;
		line-height: 1.5;
		margin: 0;
	}
	@media (max-width: 900px) {
		.product-info-blocks {
			grid-template-columns: 1fr;
		}
	}
</style>
