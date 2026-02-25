<script lang="ts">
	let {
		title = 'Movement, simplified.',
		subtitle = 'Scandinavian-inspired athleisure designed for everyday balance.',
		ctaHref = '/collections/core-essentials',
		ctaLabel = 'SHOP CORE ESSENTIALS →',
		videoSrc = 'https://cdn.mignite.app/ws/works_01KGFKTHDC6ZD3WS7GQTX8992N/Bring_a_bit_202602041404_u6uf6-01KGMC3H3BPBGYA1KXAMFFT0AM.mp4'
	}: {
		title?: string;
		subtitle?: string;
		ctaHref?: string;
		ctaLabel?: string;
		videoSrc?: string;
	} = $props();
</script>

<main class="hero">
	<div class="hero-bg">
		<video class="hero-video" autoplay muted loop playsinline aria-hidden="true">
			<source src={videoSrc} type="video/mp4" />
		</video>
	</div>
	<div class="hero-content">
		<h1 class="hero-title">{title}</h1>
		<p class="hero-subtitle">{subtitle}</p>
		<a href={ctaHref} class="hero-cta">{ctaLabel}</a>
	</div>
</main>

<style>
	.hero {
		position: relative;
		min-height: calc(100vh - 120px);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.hero-bg {
		position: absolute;
		inset: 0;
	}
	.hero-video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.hero-bg::after {
		content: '';
		position: absolute;
		inset: 0;
		background: rgba(255, 255, 255, 0.25);
	}
	.hero-content {
		position: relative;
		z-index: 1;
		text-align: center;
		padding: 2rem;
		max-width: 560px;
	}
	.hero-title {
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 700;
		margin: 0 0 0.75rem;
		letter-spacing: -0.02em;
		line-height: 1.1;
		color: #1a1a1a;
	}
	.hero-subtitle {
		font-size: 1.125rem;
		font-weight: 400;
		color: #4a4a4a;
		margin: 0 0 2rem;
		line-height: 1.5;
	}
	.hero-cta {
		display: inline-block;
		background: #1a1a1a;
		color: #fff;
		text-decoration: none;
		font-size: 0.8125rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0.875rem 1.5rem;
		transition: background 0.2s;
	}
	.hero-cta:hover {
		background: #333;
	}
</style>
