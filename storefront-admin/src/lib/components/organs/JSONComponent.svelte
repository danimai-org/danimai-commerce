<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.css';

	function escapeAttr(s: string): string {
		return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
	}

	function escapeHtml(s: string): string {
		return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function sanitizeHljsFragment(html: string): string {
		const parser = new DOMParser();
		const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
		const container = doc.body.firstChild;
		if (!container) return '';

		function safeNode(n: Node): string {
			if (n.nodeType === Node.TEXT_NODE) {
				return escapeHtml(n.textContent ?? '');
			}
			if (n.nodeType !== Node.ELEMENT_NODE) return '';
			const el = n as Element;
			if (el.tagName !== 'SPAN') return '';
			const cls = el.getAttribute('class');
			if (!cls || !cls.split(/\s+/).every((c) => c === 'hljs' || c.startsWith('hljs-'))) {
				return '';
			}
			return `<span class="${escapeAttr(cls)}">${Array.from(el.childNodes).map(safeNode).join('')}</span>`;
		}

		return Array.from(container.childNodes).map(safeNode).join('');
	}

	function hljsJsonHighlight(node: HTMLElement, json: string) {
		const apply = () => {
			if (!json) {
				node.textContent = '';
				return;
			}
			const raw = hljs.highlight(json, { language: 'json' }).value;
			if (typeof DOMParser === 'undefined') {
				node.textContent = json;
				return;
			}
			node.innerHTML = sanitizeHljsFragment(raw);
		};
		apply();
		return { update: apply };
	}
	interface Props {
		product: Record<string, unknown> | null;
		options: unknown[];
		variants: unknown[];
		category: unknown;
	}

	let { product, options = [], variants = [], category }: Props = $props();

	let jsonSheetOpen = $state(false);

	const productJsonForView = $derived(
		product
			? {
					...product,
					options,
					variants,
					category
				}
			: null
	);
	const jsonKeysCount = $derived(productJsonForView ? Object.keys(productJsonForView).length : 0);
	const jsonString = $derived(
		productJsonForView ? JSON.stringify(productJsonForView, null, 2) : ''
	);
</script>

<div class="rounded-lg border bg-card p-4 shadow-sm">
	<div class="flex items-center justify-between gap-3">
		<div class="flex min-w-0 flex-1 items-center gap-2">
			<h3 class="shrink-0 font-medium">JSON</h3>
			<span
				class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs whitespace-nowrap text-muted-foreground"
			>
				{jsonKeysCount} keys
			</span>
		</div>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={() => (jsonSheetOpen = true)}
		>
			<ExternalLink class="size-4" />
			<span class="sr-only">Open</span>
		</Button>
	</div>
</div>

<Sheet.Root bind:open={jsonSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<div class="shrink-0 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">JSON {jsonKeysCount} keys</h2>
			</div>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if productJsonForView}
					<div class="mt-4 overflow-hidden rounded-md bg-[#0d1117] p-4">
						<pre class="overflow-x-auto text-sm">
							<code class="hljs" use:hljsJsonHighlight={jsonString}></code>
						</pre>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">No data</p>
				{/if}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
