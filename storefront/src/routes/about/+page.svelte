<script lang="ts">
    import AboutCraftedSection from "$lib/components/about/AboutCraftedSection.svelte";
    import AboutHeroSection from "$lib/components/about/AboutHeroSection.svelte";
    import AboutPartnersSection from "$lib/components/about/AboutPartnersSection.svelte";
    import AboutPrinciplesSection from "$lib/components/about/AboutPrinciplesSection.svelte";
    import AboutPurposeSection from "$lib/components/about/AboutPurposeSection.svelte";

    import { SiteHeader, SiteFooter } from "$lib/components/layout";
</script>

<div class="page-about">
    <SiteHeader />

    <AboutHeroSection />

    <AboutPurposeSection />

    <AboutCraftedSection
        ctaHref="/about#principles"
        ctaLabel="OUR PRINCIPLES →"
    />

    <AboutPartnersSection />

    <AboutPrinciplesSection />

    <SiteFooter />
</div>
