<template>
  <div class="mx-auto max-w-2xl space-y-8 py-8">
    <div>
      <UButton
        :to="listUrl"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        class="-ml-2 mb-4"
      >
        Back to PR list
      </UButton>
      <h1 class="text-2xl font-bold tracking-tight">
        Pull request #{{ number }}
      </h1>
      <p class="mt-1 font-mono text-sm text-muted">{{ owner }}/{{ repo }}</p>
      <div class="mt-3">
        <UButton
          :to="settingsUrl"
          variant="outline"
          color="neutral"
          size="xs"
          icon="i-lucide-settings"
        >
          AI review settings
        </UButton>
      </div>
    </div>

    <AiReviewPanel :owner="owner" :name="repo" :number="number" />

    <p class="text-center text-sm text-muted">
      Full PR timeline and comments will expand in a future release.
      <a
        :href="githubPrUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary underline-offset-2 hover:underline"
      >
        Open on GitHub
      </a>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const owner = computed(() => String(route.params.owner))
const repo = computed(() => String(route.params.name))
const number = computed(() => String(route.params.number))

const listUrl = computed(
  () => `/dashboard/repos/${owner.value}/${repo.value}/pulls`,
)

const settingsUrl = computed(
  () => `/dashboard/repos/${owner.value}/${repo.value}/settings`,
)

const githubPrUrl = computed(
  () =>
    `https://github.com/${encodeURIComponent(owner.value)}/${encodeURIComponent(repo.value)}/pull/${encodeURIComponent(number.value)}`,
)
</script>
