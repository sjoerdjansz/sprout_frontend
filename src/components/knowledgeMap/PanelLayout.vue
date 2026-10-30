<template>
  <!-- The detail panel's frame: the content scrolls, the actions stay pinned at the bottom. -->
  <div class="flex min-h-0 flex-auto flex-col">
    <div class="flex flex-auto flex-col gap-5 p-6 rail:min-h-0 rail:overflow-y-auto">
      <slot />
    </div>
    <div class="flex-none border-t border-line bg-surface px-6 pt-4 pb-6">
      <slot name="footer" />
    </div>
  </div>
</template>
