<template>
  <a
    :href="pr.htmlUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="block rounded-lg border border-default bg-elevated/30 p-4 transition hover:bg-elevated/50"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge v-if="pr.draft" color="neutral" variant="subtle" size="xs">
            Draft
          </UBadge>
          <UBadge
            :color="pr.state === 'open' ? 'success' : 'neutral'"
            variant="subtle"
            size="xs"
          >
            {{ pr.state }}
          </UBadge>
          <span class="text-dimmed">#{{ pr.number }}</span>
        </div>
        <p class="mt-1 font-medium leading-snug">{{ pr.title }}</p>
        <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-dimmed">
          <span v-if="pr.author" class="inline-flex items-center gap-1">
            <UAvatar :src="pr.author.avatarUrl" size="3xs" />
            {{ pr.author.login }}
          </span>
          <span>Updated {{ formatDate(pr.updatedAt) }}</span>
          <span v-if="pr.mergeableState && pr.mergeableState !== 'unknown'">
            Merge: {{ pr.mergeableState }}
          </span>
        </div>
      </div>
      <UIcon name="i-lucide-external-link" class="size-4 shrink-0 text-dimmed" />
    </div>
  </a>
</template>

<script setup>
defineProps({
  pr: {
    type: Object,
    required: true,
  },
})

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}
</script>
