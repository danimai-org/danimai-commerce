<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { tick } from 'svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import X from '@lucide/svelte/icons/x';
	import {
		Dialog,
		DialogPortal,
		DialogOverlay,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	export type GalleryImage = { id?: string; src: string };

	type Props = {
		open?: boolean;
		images?: GalleryImage[];
		initialIndex?: number;
	};

	let {
		open = $bindable(false),
		images = [] as GalleryImage[],
		initialIndex = 0
	}: Props = $props();

	let activeIndex = $state(0);
	let touchStartX = $state<number | null>(null);

	const total = $derived(images.length);
	const currentSrc = $derived(images[activeIndex]?.src?.trim() ?? '');

	function clampIndex(i: number): number {
		if (total <= 0) return 0;
		return Math.min(Math.max(0, i), total - 1);
	}

	function goPrev() {
		activeIndex = clampIndex(activeIndex - 1);
	}

	function goNext() {
		activeIndex = clampIndex(activeIndex + 1);
	}

	$effect(() => {
		if (!open) return;
		activeIndex = clampIndex(initialIndex);
	});

	$effect(() => {
		if (!open || total === 0) return;
		activeIndex = clampIndex(activeIndex);
	});

	$effect(() => {
		if (!open || total > 0) return;
		open = false;
	});

	$effect(() => {
		if (!open) return;
		const i = activeIndex;
		void tick().then(() => {
			document
				.getElementById(`image-gallery-thumb-${i}`)
				?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		});
	});

	$effect(() => {
		if (!open) return;
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				goPrev();
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				goNext();
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	});

	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0]?.clientX ?? null;
	}

	function onTouchEnd(e: TouchEvent) {
		if (touchStartX === null || total <= 1) return;
		const endX = e.changedTouches[0]?.clientX ?? touchStartX;
		const dx = endX - touchStartX;
		const threshold = 48;
		if (dx > threshold) goPrev();
		else if (dx < -threshold) goNext();
		touchStartX = null;
	}
</script>

<Dialog bind:open>
	{#if total > 0}
		<DialogPortal>
			<DialogOverlay
				class={cn(
					'fixed inset-0 z-50 bg-black/90 backdrop-blur-[2px]',
					'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:duration-300 data-[state=open]:duration-300'
				)}
			/>
			<DialogPrimitive.Content
				class={cn(
					'fixed inset-0 z-50 flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-transparent p-0 shadow-none outline-none',
					'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:duration-300 data-[state=open]:duration-300'
				)}
			>
				<DialogTitle class="sr-only">Image gallery</DialogTitle>

				<div class="pointer-events-none absolute end-3 top-3 z-[60] sm:end-4 sm:top-4">
					<DialogPrimitive.Close
						class="pointer-events-auto inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-2 text-sm text-white opacity-90 ring-offset-background transition-colors hover:bg-white/20 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
					>
						<span class="text-xs text-white/80">esc</span>
						<X class="size-4" />
						<span class="sr-only">Close gallery</span>
					</DialogPrimitive.Close>
				</div>

				<div class="flex min-h-0 flex-1 flex-col pt-14 pb-2">
					<p
						class="pointer-events-none shrink-0 px-4 pb-2 text-center text-sm tabular-nums text-white/90"
						aria-live="polite"
					>
						{activeIndex + 1} / {total}
					</p>

					<div
						class="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-10 sm:px-14"
						ontouchstart={onTouchStart}
						ontouchend={onTouchEnd}
						role="presentation"
					>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="absolute start-1 top-1/2 z-[55] size-10 -translate-y-1/2 shrink-0 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white disabled:pointer-events-none disabled:opacity-30 sm:start-3 sm:size-11"
							disabled={activeIndex <= 0}
							onclick={goPrev}
							aria-label="Previous image"
						>
							<ChevronLeft class="size-6" />
						</Button>

						{#key activeIndex}
							<img
								src={currentSrc}
								alt=""
								class="max-h-[min(78vh,100dvh)] max-w-[min(94vw,100dvw)] select-none object-contain transition-opacity duration-200"
								draggable="false"
								onerror={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')}
							/>
						{/key}

						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="absolute end-1 top-1/2 z-[55] size-10 -translate-y-1/2 shrink-0 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white disabled:pointer-events-none disabled:opacity-30 sm:end-3 sm:size-11"
							disabled={activeIndex >= total - 1}
							onclick={goNext}
							aria-label="Next image"
						>
							<ChevronRight class="size-6" />
						</Button>
					</div>

					<div
						class="max-h-[28vh] shrink-0 overflow-x-auto overflow-y-hidden border-t border-white/10 bg-black/35 px-3 py-3 [-webkit-overflow-scrolling:touch]"
					>
						<div class="mx-auto flex w-max gap-2 px-1 pb-1">
							{#each images as img, i (img.id ?? `${i}-${img.src}`)}
								<button
									id="image-gallery-thumb-{i}"
									type="button"
									class={cn(
										'size-14 shrink-0 overflow-hidden rounded-md border-2 transition-all sm:size-16',
										i === activeIndex
											? 'border-white opacity-100 ring-2 ring-white/40 ring-offset-2 ring-offset-black/50'
											: 'border-transparent opacity-55 hover:opacity-90'
									)}
									onclick={() => (activeIndex = i)}
									aria-label="View image {i + 1}"
									aria-current={i === activeIndex ? 'true' : undefined}
								>
									<img
										src={img.src}
										alt=""
										class="size-full object-cover"
										draggable="false"
										onerror={(ev) =>
											((ev.currentTarget as HTMLImageElement).style.display = 'none')}
									/>
								</button>
							{/each}
						</div>
					</div>
				</div>
			</DialogPrimitive.Content>
		</DialogPortal>
	{/if}
</Dialog>
