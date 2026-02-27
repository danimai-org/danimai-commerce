<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { DROPDOWN_CTX, type DropdownContext } from './context';

  const open = writable(false);

  const ctx: DropdownContext = {
    open,
    openMenu: () => open.set(true),
    closeMenu: () => open.set(false),
    toggleMenu: () => open.update((v) => !v),
  };

  setContext(DROPDOWN_CTX, ctx);
</script>

<div>
  <slot />
</div>

