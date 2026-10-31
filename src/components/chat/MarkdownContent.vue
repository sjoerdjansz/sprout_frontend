<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'

const { source } = defineProps<{
  source: string
}>()

// html: false escapes any HTML in the text, and markdown-it refuses javascript: and similar
// links, so a reply can't inject markup. That's what makes the v-html below safe.
const markdown = new MarkdownIt({ html: false })

const html = computed<string>(() => markdown.render(source))

// The rendered HTML can't carry classes, so its elements are styled from the wrapper.
const contentClasses = [
  '[&_ol]:mb-2.5 [&_p]:mb-2.5 [&_ul]:mb-2.5 [&>:last-child]:mb-0',
  '[&_h1]:mb-2 [&_h1]:font-display [&_h1]:text-title [&_h2]:mb-2 [&_h2]:text-heading',
  '[&_h3]:mb-1.5 [&_h3]:text-body-strong [&_h4]:mb-1.5 [&_h4]:text-body-strong',
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5',
  '[&_strong]:font-[650]',
  '[&_code]:font-mono [&_code]:text-[0.9em]',
  '[&_a]:text-primary [&_a]:underline',
]
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div :class="contentClasses" v-html="html" />
</template>
