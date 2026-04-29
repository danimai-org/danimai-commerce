<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { client } from '$lib/client';
	import { getDetailContext } from '$lib/hooks';
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

	function statusDotClass(s: string | undefined): string {
		if (s === 'published') return 'bg-emerald-500';
		if (s === 'draft' || !s) return 'bg-muted-foreground/60';
		if (s === 'proposed') return 'bg-amber-500';
		if (s === 'rejected') return 'bg-red-500';
		return 'bg-muted-foreground/60';
	}
</script>

<div class="rounded-lg border border-gray-300 bg-card p-6 shadow-sm">
	<h2 class="mb-4 font-semibold">Status</h2>
	<Select.Root
		type="single"
		value={localStatus}
		onValueChange={(v) => {
			if (v && (v === 'draft' || v === 'proposed' || v === 'published' || v === 'rejected')) {
				void updateStatus(v);
			}
		}}
	>
		<Select.Trigger class="w-full">
			<span class="flex items-center gap-2">
				<span
					class={`inline-block size-2 shrink-0 rounded-full ${statusDotClass(localStatus)}`}
					aria-hidden="true"
				></span>
				<span>{statusLabel(localStatus)}</span>
			</span>
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="published" label="Active">
				<span class="flex items-center gap-2">
					<span class="inline-block size-2 shrink-0 rounded-full bg-emerald-500"></span>
					<span>Active</span>
				</span>
			</Select.Item>
			<Select.Item value="draft" label="Draft">
				<span class="flex items-center gap-2">
					<span class="inline-block size-2 shrink-0 rounded-full bg-muted-foreground/60"></span>
					<span>Draft</span>
				</span>
			</Select.Item>
			<Select.Item value="proposed" label="Unlisted">
				<span class="flex items-center gap-2">
					<span class="inline-block size-2 shrink-0 rounded-full bg-amber-500"></span>
					<span>Unlisted</span>
				</span>
			</Select.Item>
			<Select.Item value="rejected" label="Rejected">
				<span class="flex items-center gap-2">
					<span class="inline-block size-2 shrink-0 rounded-full bg-red-500"></span>
					<span>Rejected</span>
				</span>
			</Select.Item>
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
	>
		<Select.Trigger class="w-full">
			{localStatus === 'published' ? 'Public' : 'Private'}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="public" label="Public">Public</Select.Item>
			<Select.Item value="private" label="Private">Private</Select.Item>
		</Select.Content>
	</Select.Root>
</div>
