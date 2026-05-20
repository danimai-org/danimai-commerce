<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { client } from '$lib/client';
	import { getDetailContext } from '$lib/hooks';
	import { cn } from '$lib/utils.js';
	import type { Product } from '../type';

	const detailQuery = getDetailContext<Product>();
	const product = $derived(detailQuery?.data ?? null);

	const status = $derived((product as { status?: string } | null)?.status ?? 'draft');
	let submitting = $state(false);
	let localStatus = $state<'draft' | 'proposed' | 'published' | 'rejected'>('draft');

	$effect(() => {
		if (
			status === 'draft' ||
			status === 'proposed' ||
			status === 'published' ||
			status === 'rejected'
		) {
			localStatus = status;
		} else {
			localStatus = 'draft';
		}
	});

	async function updateStatus(nextStatus: 'draft' | 'proposed' | 'published' | 'rejected') {
		if (
			!product ||
			!(product as { id?: string } | undefined)?.id ||
			submitting ||
			nextStatus === localStatus
		)
			return;
		const previousStatus = localStatus;
		localStatus = nextStatus;
		submitting = true;
		try {
			const res = await client
				.products({ id: (product as { id?: string } | undefined)?.id ?? '' })
				.put({
					status: nextStatus
				});
			if (res.error) {
				throw new Error('Failed to update status');
			}
			await detailQuery?.refetch?.();
		} catch {
			localStatus = previousStatus;
		} finally {
			submitting = false;
		}
	}

	function statusLabel(s: string | undefined): string {
		if (!s) return 'Draft';
		if (s === 'published') return 'Active';
		if (s === 'draft') return 'Draft';
		if (s === 'proposed') return 'Unlisted';
		if (s === 'rejected') return 'Rejected';
		return s;
	}

	function statusBadgeClass(s: string | undefined): string {
		if (s === 'published') return 'bg-green-500/10 text-green-700 dark:text-green-400';
		if (s === 'proposed') return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
		if (s === 'rejected') return 'bg-red-500/10 text-red-700 dark:text-red-400';
		return 'bg-muted text-muted-foreground';
	}

	function statusDotClass(s: string | undefined): string {
		if (s === 'published') return 'bg-green-600';
		if (s === 'proposed') return 'bg-amber-600';
		if (s === 'rejected') return 'bg-red-600';
		return 'bg-muted-foreground/60';
	}
</script>

<div class="min-w-0 rounded-lg border bg-card p-6 shadow-sm">
	<h2 class="mb-4 font-semibold">Status</h2>
	<Select.Root
		type="single"
		value={localStatus}
		onValueChange={(v) => {
			if (v && (v === 'draft' || v === 'proposed' || v === 'published' || v === 'rejected')) {
				void updateStatus(v);
			}
		}}
		disabled={submitting}
	>
		<Select.Trigger class="h-9 w-full">
			<span
				class={cn(
					'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
					statusBadgeClass(localStatus)
				)}
			>
				<span
					class={cn('size-1.5 shrink-0 rounded-sm', statusDotClass(localStatus))}
					aria-hidden="true"
				></span>
				{statusLabel(localStatus)}
			</span>
		</Select.Trigger>
		<Select.Content class="min-w-[var(--bits-select-anchor-width)]">
			<Select.Item value="published" label="Active">Active</Select.Item>
			<Select.Item value="draft" label="Draft">Draft</Select.Item>
			<Select.Item value="proposed" label="Unlisted">Unlisted</Select.Item>
			<Select.Item value="rejected" label="Rejected">Rejected</Select.Item>
		</Select.Content>
	</Select.Root>

	<h2 class="mt-6 mb-4 font-semibold">Visibility</h2>
	<Select.Root
		type="single"
		value={localStatus === 'published' ? 'public' : 'private'}
		onValueChange={(v) => {
			if (v === 'public') void updateStatus('published');
			if (v === 'private') void updateStatus('draft');
		}}
		disabled={submitting}
	>
		<Select.Trigger class="h-9 w-full">
			<span class="text-sm">{localStatus === 'published' ? 'Public' : 'Private'}</span>
		</Select.Trigger>
		<Select.Content class="min-w-[var(--bits-select-anchor-width)]">
			<Select.Item value="public" label="Public">Public</Select.Item>
			<Select.Item value="private" label="Private">Private</Select.Item>
		</Select.Content>
	</Select.Root>
</div>
