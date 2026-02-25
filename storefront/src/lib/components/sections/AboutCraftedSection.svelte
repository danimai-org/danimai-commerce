<script lang="ts">
	let {
		title = 'Crafted for Movement',
		text = 'Founded in Copenhagen, Essentials emerged from a simple truth: movement is life, and life demands clothing that adapts. We design for the body in motion—breathable, durable, and effortlessly versatile. Every seam and fabric choice serves your daily rhythm.',
		ctaHref = '/about',
		ctaLabel = 'OUR STORY →'
	}: {
		title?: string;
		text?: string;
		ctaHref?: string;
		ctaLabel?: string;
	} = $props();
</script>

<section class="about-crafted">
	<div class="about-crafted-image"></div>
	<div class="about-crafted-content">
		<h2 class="about-crafted-title">{title}</h2>
		<p class="about-crafted-text">{text}</p>
		<a href={ctaHref} class="about-crafted-cta">{ctaLabel}</a>
	</div>
</section>

<style>
	.about-crafted {
		display: grid;
		grid-template-columns: 1fr 1fr;
		max-width: 100%;
	}
	.about-crafted-image {
		aspect-ratio: 3/4;
		background: linear-gradient(135deg, #6b7c5c 0%, #5a6b4a 50%, #4a5a3a 100%);
		min-height: 400px;
	}
	.about-crafted-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 4rem 3rem;
		background: #f8f6f3;
	}
	.about-crafted-title {
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		font-weight: 700;
		margin: 0 0 1rem;
		letter-spacing: -0.02em;
		color: #1a1a1a;
	}
	.about-crafted-text {
		color: #4a4a4a;
		line-height: 1.6;
		margin: 0 0 1.5rem;
	}
	.about-crafted-cta {
		font-size: 0.8125rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #1a1a1a;
		text-decoration: none;
		align-self: flex-start;
	}
	.about-crafted-cta:hover {
		text-decoration: underline;
	}
	@media (max-width: 900px) {
		.about-crafted {
			grid-template-columns: 1fr;
		}
		.about-crafted-content {
			padding: 2rem 1.5rem;
		}
	}
</style>
