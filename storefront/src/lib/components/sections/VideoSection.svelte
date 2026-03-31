<script lang="ts">
	let {
		posterSrc = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80',
		heading = 'Behind the fabric'
	}: {
		posterSrc?: string;
		heading?: string;
	} = $props();
</script>

<section class="video-section" aria-label={heading}>
	<div class="video-frame">
		<img src={posterSrc} alt="" class="video-poster" width="1600" height="900" />
		<button type="button" class="video-play" aria-label="Play video">
			<span class="video-play-icon" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
			</span>
		</button>
	</div>
</section>

<style>
	.video-section {
		max-width: var(--section-max-width, 1200px);
		margin: 0 auto;
		padding: 0 var(--section-padding-x, 1.5rem) var(--section-padding-y, 4rem);
		box-sizing: border-box;
	}
	.video-frame {
		position: relative;
		aspect-ratio: 21 / 9;
		max-height: 72vh;
		background: #222;
		overflow: hidden;
	}
	.video-poster {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.video-play {
		position: absolute;
		inset: 0;
		margin: auto;
		width: 4.5rem;
		height: 4.5rem;
		border-radius: 999px;
		border: 2px solid rgba(255, 255, 255, 0.9);
		background: rgba(0, 0, 0, 0.35);
		color: #fff;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 0.75rem 0.75rem 0.95rem;
		transition: background 0.2s, transform 0.2s;
	}
	.video-play:hover {
		background: rgba(0, 0, 0, 0.55);
		transform: scale(1.04);
	}
	.video-play-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	@media (max-width: 767px) {
		.video-section {
			padding-bottom: var(--section-padding-y, 3rem);
		}
		.video-frame {
			aspect-ratio: 16 / 10;
		}
	}
</style>
