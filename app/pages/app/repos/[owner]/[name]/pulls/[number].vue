<template>
  <div class="mx-auto max-w-lg py-16 text-center">
    <UIcon name="i-lucide-construction" class="mx-auto size-12 text-dimmed" />
    <h1 class="mt-4 text-xl font-semibold">Pull request detail</h1>
    <p class="mt-2 text-muted">
      Comments, timeline, and Cursor-powered reviews will land in a future
      release. PR #{{ number }} in
      <span class="font-mono text-sm">{{ owner }}/{{ repo }}</span>
    </p>
    <UButton :to="listUrl" class="mt-6" variant="soft">
      Back to PR list
    </UButton>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app' })

const route = useRoute()
const owner = computed(() => String(route.params.owner))
const repo = computed(() => String(route.params.name))
const number = computed(() => String(route.params.number))

const listUrl = computed(
  () => `/app/repos/${owner.value}/${repo.value}/pulls`,
)
</script>
