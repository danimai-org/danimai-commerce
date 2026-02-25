<script lang="ts">
	let {
		title = 'Our Story',
		subtitle = 'Movement-focused design for a life in motion',
		imageSrc = 'https://cdn.mignite.app/ws/works_01KGFKTHDC6ZD3WS7GQTX8992N/generated-01KGHSDPQM7Z6D9PGFG9E15S5P-01KGHSDPQMZFXQV23Z6NVYBARS.jpeg'
	}: {
		title?: string;
		subtitle?: string;
		imageSrc?: string;
	} = $props();
</script>

<section class="about-hero">
	<div class="about-hero-bg" style="background-image: url('{imageSrc}');"></div>
	<div class="about-hero-overlay"></div>
	<div class="about-hero-content">
		<h1 class="about-hero-title">{title}</h1>
		<p class="about-hero-subtitle">{subtitle}</p>
	</div>
</section>

<style>
	.about-hero {
		position: relative;
		min-height: 50vh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.about-hero-bg {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
	}
	.about-hero-overlay {
		position: absolute;
		inset: 0;
		background: rgba(255, 255, 255, 0.4);
	}
	.about-hero-content {
		position: relative;
		z-index: 1;
		text-align: center;
		padding: 2rem;
	}
	.about-hero-title {
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 700;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
		color: #1a1a1a;
	}
	.about-hero-subtitle {
		font-size: 1.125rem;
		color: #4a4a4a;
		margin: 0;
		font-weight: 400;
	}
</style>
