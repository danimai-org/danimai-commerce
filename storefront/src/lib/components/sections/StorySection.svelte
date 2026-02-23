<script lang="ts">
	let {
		title = 'Built for the in-between',
		text = 'Essentials is built for the in-between moments – the walk to the studio, the coffee after training, the quiet hours at home.',
		ctaHref = '/about',
		ctaLabel = 'OUR STORY →'
	}: {
		title?: string;
		text?: string;
		ctaHref?: string;
		ctaLabel?: string;
	} = $props();
</script>

<section class="section story-section">
	<div class="story-image">
		<img
			src="https://cdn.mignite.app/ws/works_01KGFKTHDC6ZD3WS7GQTX8992N/nano_banana_pro_20260204_141238_1-01KGMCQQ1KXNTY3K55VA3T84KE.png"
			alt=""
		/>
	</div>
	<div class="story-content">
		<h2 class="story-title">{title}</h2>
		<p class="story-text">{text}</p>
		<a href={ctaHref} class="story-cta">{ctaLabel}</a>
	</div>
</section>

<style>
	.story-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		padding: 0;
		max-width: 100%;
		overflow: hidden;
	}
	.story-image {
		aspect-ratio: 3/4;
		background: linear-gradient(135deg, #4a4a4a 0%, #2d2d2d 100%);
		min-height: 400px;
		overflow: hidden;
		position: relative;
	}
	.story-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.story-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem);
		background: #f8f6f3;
	}
	.story-title {
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		font-weight: 700;
		margin: 0 0 1rem;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}
	.story-text {
		color: #4a4a4a;
		line-height: 1.65;
		margin: 0 0 1.5rem;
		max-width: 42ch;
	}
	.story-cta {
		font-size: 0.8125rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #1a1a1a;
		text-decoration: none;
		align-self: flex-start;
		transition: opacity 0.2s ease;
	}
	.story-cta:hover {
		text-decoration: underline;
		opacity: 0.8;
	}
	@media (max-width: 900px) {
		.story-section {
			grid-template-columns: 1fr;
		}
		.story-image {
			aspect-ratio: 16/10;
			min-height: 280px;
		}
		.story-content {
			padding: 2rem 1.5rem;
		}
	}
</style>
