<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte';
  import { DROPDOWN_CTX } from './context';
  import type { DropdownContext } from './context';

  const ctx = getContext<DropdownContext>(DROPDOWN_CTX);
  const dispatch = createEventDispatcher<{ select: { originalEvent: MouseEvent; textValue?: string } }>();

  let className: string | undefined = undefined;
  let textValue: string | undefined = undefined;
  let onSelect: (() => void) | undefined = undefined;

  export { className as class, textValue, onSelect };

  function handleClick(event: MouseEvent) {
    onSelect?.();
    dispatch('select', { originalEvent: event, textValue });
    ctx.closeMenu();
  }
</script>

<button
  type="button"
  class={className}
  on:click|stopPropagation={handleClick}
>
  <slot />
</button>

