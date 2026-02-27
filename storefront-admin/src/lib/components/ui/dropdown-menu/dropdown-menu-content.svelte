<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { DROPDOWN_CTX } from './context';
  import type { DropdownContext } from './context';

  const ctx = getContext<DropdownContext>(DROPDOWN_CTX);

  let className: string | undefined = undefined;
  // sideOffset is accepted for API compatibility but ignored
  let sideOffset: number | undefined = undefined;

  export { className as class, sideOffset };

  let open = false;
  const unsubscribe = ctx.open.subscribe((v) => (open = v));
  onDestroy(unsubscribe);
</script>

{#if open}
  <div class={className}>
    <slot />
  </div>
{/if}

