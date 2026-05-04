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
