<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <UButton
          to="/app"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
          class="-ml-2 mb-2"
        >
          Dashboard
        </UButton>
        <h1 class="text-2xl font-bold tracking-tight">
          Pull requests
        </h1>
        <p class="mt-1 font-mono text-sm text-muted">{{ owner }}/{{ name }}</p>
      </div>
      <USelect
        v-model="state"
        :items="stateItems"
        class="w-44"
        size="md"
      />
    </div>

    <div v-if="pending" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-dimmed" />
    </div>

    <EmptyState
      v-else-if="!data?.pulls?.length"
      title="No pull requests match this filter"
    />

    <div v-else class="space-y-3">
      <PullRequestRow
      v-for="pr in data.pulls"
      :key="pr.number"
      :pr="pr"
      :owner="owner"
      :repo="name"
    />
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'app' })

const route = useRoute()
const owner = computed(() => String(route.params.owner))
const name = computed(() => String(route.params.name))

const state = ref('open')
const stateItems = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
  { label: 'All', value: 'all' },
]

const { data, pending } = await useFetch(
  () =>
    `/api/repos/${encodeURIComponent(owner.value)}/${encodeURIComponent(name.value)}/pulls?state=${state.value}`,
  { watch: [state, owner, name], server: true },
)
</script>
