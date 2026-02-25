<script lang="ts">
	import { SiteHeader, SiteFooter } from '$lib/components/layout';
	import {
		AboutHeroSection,
		AboutPurposeSection,
		AboutCraftedSection,
		AboutPartnersSection,
		AboutPrinciplesSection
	} from '$lib/components/sections';
</script>

<SiteHeader />

<AboutHeroSection />

<AboutPurposeSection />

<AboutCraftedSection ctaHref="/about#principles" ctaLabel="OUR PRINCIPLES →" />

<AboutPartnersSection />

<AboutPrinciplesSection />

<SiteFooter />

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
		color: #1a1a1a;
	}
</style>
