<template>
  <!-- Summary HTML is from our backend (Cursor); sanitize if exposing untrusted markdown. -->
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="markdown-body text-sm text-default"
    v-html="html"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { computed } from 'vue'

const props = defineProps<{
  source: string
}>()

const html = computed(() => {
  const src = props.source ?? ''
  if (!src.trim()) return ''
  return marked.parse(src, { async: false, breaks: true, gfm: true }) as string
})
</script>

<style scoped>
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-weight: 600;
  margin-top: 0.75rem;
  margin-bottom: 0.35rem;
  line-height: 1.25;
}
.markdown-body :deep(h1) {
  font-size: 1.125rem;
}
.markdown-body :deep(h2) {
  font-size: 1.05rem;
}
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-size: 1rem;
}
.markdown-body :deep(p) {
  margin: 0.35rem 0;
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0.35rem 0;
  padding-left: 1.25rem;
}
.markdown-body :deep(li) {
  margin: 0.15rem 0;
}
.markdown-body :deep(a) {
  color: var(--ui-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.markdown-body :deep(code) {
  font-family: ui-monospace, monospace;
  font-size: 0.85em;
  padding: 0.1em 0.35em;
  border-radius: 0.25rem;
  background: var(--ui-bg-accented);
}
.markdown-body :deep(pre) {
  margin: 0.5rem 0;
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  background: var(--ui-bg-muted);
  border: 1px solid var(--ui-border);
}
.markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  font-size: 0.8125rem;
}
.markdown-body :deep(blockquote) {
  margin: 0.5rem 0;
  padding-left: 0.75rem;
  border-left: 3px solid var(--ui-border-accented);
  color: var(--ui-text-muted);
}
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  margin: 0.5rem 0;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--ui-border);
  padding: 0.35rem 0.5rem;
  text-align: left;
}
.markdown-body :deep(th) {
  background: var(--ui-bg-muted);
}
</style>
