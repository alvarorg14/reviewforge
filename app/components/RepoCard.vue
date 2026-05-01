<template>
  <UCard as="article" :ui="{ body: 'p-4 sm:p-5' }">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <UIcon
            :name="repo.private ? 'i-lucide-lock' : 'i-lucide-book-marked'"
            class="size-4 shrink-0 text-dimmed"
          />
          <h3 class="truncate font-medium">
            {{ repo.fullName }}
          </h3>
          <UBadge v-if="repo.private" color="neutral" variant="subtle" size="xs">
            Private
          </UBadge>
        </div>
        <p v-if="repo.defaultBranch" class="mt-1 text-xs text-dimmed">
          Default: {{ repo.defaultBranch }}
        </p>
      </div>
      <UButton
        :to="`/app/repos/${repo.owner}/${repo.name}/pulls`"
        size="sm"
        color="primary"
        variant="soft"
      >
        Pull requests
      </UButton>
    </div>
  </UCard>
</template>

<script setup>
defineProps({
  repo: {
    type: Object,
    required: true,
  },
})
</script>
