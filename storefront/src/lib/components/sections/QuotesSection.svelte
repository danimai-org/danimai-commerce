<script lang="ts">
	interface Quote {
		text: string;
		cite: string;
	}

	let {
		quotes = [
			{
				text: "The leather is sourced from environmentally friendly tanneries in Italy, France, and Turkey, where Rune is based and everything is assembled by hand.",
				cite: "Nordic Magazine"
			},
			{
				text: "All too often, we're forced to pick style, or sustainability. Recently, more designers have been making environmental impact a top priority.",
				cite: "The Minimalist Edit"
			}
		]
	}: {
		quotes?: Quote[];
	} = $props();
</script>

<section class="section quotes-section">
	<div class="quotes-bg"></div>
	<div class="quotes-cards">
		{#each quotes as quote}
			<blockquote class="quote-card">
				<span class="quote-mark">"</span>
				<p>{quote.text}</p>
				<cite>{quote.cite}</cite>
			</blockquote>
		{/each}
	</div>
</section>

<style>
	.section {
		max-width: 1200px;
		margin: 0 auto;
	}
	.quotes-section {
		position: relative;
		padding: 4rem 1.5rem;
		min-height: 320px;
	}
	.quotes-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #e8e0d5 0%, #f0ebe5 100%);
	}
	.quotes-cards {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
	}
	.quote-card {
		background: #fff;
		padding: 2rem;
		margin: 0;
		border-radius: 4px;
		box-shadow: 0 2px 16px rgba(0,0,0,0.06);
	}
	.quote-mark {
		font-size: 3rem;
		line-height: 1;
		color: #ccc;
		display: block;
		margin-bottom: 0.5rem;
		font-family: Georgia, serif;
	}
	.quote-card p {
		margin: 0 0 1rem;
		line-height: 1.6;
		color: #333;
		font-size: 0.9375rem;
	}
	.quote-card cite {
		font-style: normal;
		font-size: 0.8125rem;
		color: #666;
	}
	@media (max-width: 900px) {
		.quotes-cards {
			grid-template-columns: 1fr;
		}
	}
</style>
