<script lang="ts">
	interface Quote {
		text: string;
		cite: string;
	}

	let {
		quotes = [
			{
				text: 'The fabric feels incredible—breathable for training and polished enough for coffee after.',
				cite: 'Sarah M.'
			},
			{
				text: 'Finally basics that look as good as they perform. My go-to for travel and studio days.',
				cite: 'James R.'
			}
		]
	}: {
		quotes?: Quote[];
	} = $props();
</script>

<section class="quotes-section">
	<div class="quotes-bg"></div>
	<div class="quotes-cards">
		{#each quotes as quote}
			<blockquote class="quote-card">
				<div class="stars" aria-hidden="true">
					{#each [1, 2, 3, 4, 5] as _}
						<span class="star">★</span>
					{/each}
				</div>
				<p class="quote-text">{quote.text}</p>
				<cite>{quote.cite}</cite>
			</blockquote>
		{/each}
	</div>
</section>

<style>
	.quotes-section {
		position: relative;
		max-width: var(--section-max-width, 1200px);
		margin: 0 auto;
		padding: var(--section-padding-y, 4rem) var(--section-padding-x, 1.5rem);
		min-height: 280px;
		box-sizing: border-box;
	}
	.quotes-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, #f5f2ed 0%, #ebe6df 100%);
	}
	.quotes-cards {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(1.25rem, 3vw, 2rem);
		max-width: 1000px;
		margin: 0 auto;
	}
	.quote-card {
		background: #fff;
		padding: 2rem 1.75rem;
		margin: 0;
		border-radius: 0;
		box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06);
	}
	.stars {
		display: flex;
		gap: 0.15rem;
		margin-bottom: 1rem;
		color: #1a1a1a;
		font-size: 0.875rem;
		line-height: 1;
		letter-spacing: 0.05em;
	}
	.quote-text {
		font-family: var(--font-serif, Georgia, serif);
		margin: 0 0 1rem;
		line-height: 1.55;
		color: #2a2a2a;
		font-size: clamp(0.9375rem, 1.5vw, 1.0625rem);
	}
	.quote-card cite {
		font-style: normal;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #666;
	}
	@media (max-width: 767px) {
		.quotes-cards {
			grid-template-columns: 1fr;
		}
	}
</style>
