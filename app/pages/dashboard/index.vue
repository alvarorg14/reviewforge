<template>
  <div class="space-y-10">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p class="mt-1 text-muted">
          Installations linked to your account and their imported repositories.
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <UButton
          :to="installUrl"
          :disabled="!githubAppSlug"
          icon="i-simple-icons-github"
          size="lg"
        >
          Connect repositories
        </UButton>
        <UButton
          variant="soft"
          icon="i-lucide-refresh-cw"
          size="lg"
          :loading="syncing"
          @click="syncInstallationsFromGitHub"
        >
          Sync from GitHub
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="!githubAppSlug"
      color="warning"
      variant="subtle"
      title="GitHub App slug missing"
      description="Set NUXT_PUBLIC_GITHUB_APP_SLUG (or GITHUB_APP_SLUG) so the connect button can open the correct GitHub App install page."
    />

    <div v-if="pending" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-dimmed" />
    </div>

    <EmptyState
      v-else-if="!installations?.length"
      title="No repositories connected yet"
      description="Install the ReviewForge GitHub App and grant access to the repositories you want to manage. If your organization already installed the App, use Sync from GitHub to link it to your account."
    />

    <div v-else class="space-y-12">
      <section v-for="inst in installations" :key="inst.id" class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-lg font-semibold">
              {{ inst.accountLogin }}
            </h2>
            <p class="text-sm text-dimmed">
              {{ inst.accountType }} · {{ inst.repoCount }} repos
              <span v-if="inst.suspendedAt" class="text-warning"> · suspended</span>
            </p>
          </div>
          <UButton
            :to="`/dashboard/installations/${inst.id}/select`"
            variant="soft"
            size="sm"
          >
            Manage repositories
          </UButton>
        </div>

        <div v-if="reposPending[inst.id]" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-dimmed" />
        </div>
        <EmptyState
          v-else-if="!reposByInstallation[inst.id]?.length"
          title="No repositories imported yet"
          description="Pick which repositories from this installation should appear on your dashboard."
        >
          <UButton :to="`/dashboard/installations/${inst.id}/select`" size="sm">
            Select repositories
          </UButton>
        </EmptyState>
        <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <RepoCard v-for="r in reposByInstallation[inst.id]" :key="r.id" :repo="r" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard' })

const config = useRuntimeConfig()
const githubAppSlug = computed(() => config.public.githubAppSlug)

const installUrl = computed(() => {
  const slug = githubAppSlug.value
  if (!slug) return '#'
  return `https://github.com/apps/${slug}/installations/new`
})

const toast = useToast()
const syncing = ref(false)

const {
  data: installations,
  pending,
  refresh: refreshInstallations,
} = await useFetch('/api/installations', {
  server: true,
})

async function syncInstallationsFromGitHub() {
  syncing.value = true
  try {
    const result = await $fetch('/api/installations/sync', { method: 'POST' })
    await refreshInstallations()
    toast.add({
      title: `Linked ${result.linked} installation${result.linked === 1 ? '' : 's'}`,
      description: 'Installations discovered from GitHub are now visible below.',
      color: 'success',
    })
  } catch (err) {
    const message =
      typeof err?.data?.message === 'string'
        ? err.data.message
        : typeof err?.message === 'string'
          ? err.message
          : 'Could not sync from GitHub.'
    toast.add({ title: 'Sync failed', description: message, color: 'error' })
  } finally {
    syncing.value = false
  }
}

const requestFetch = useRequestFetch()

const reposByInstallation = ref({})
const reposPending = ref({})

async function loadReposFor(inst) {
  reposPending.value[inst.id] = true
  try {
    const data = await requestFetch(`/api/installations/${inst.id}/repos`)
    reposByInstallation.value[inst.id] = data
  } finally {
    reposPending.value[inst.id] = false
  }
}

watch(
  () => installations.value,
  async (list) => {
    if (!list?.length) return
    await Promise.all(list.map((i) => loadReposFor(i)))
  },
  { immediate: true },
)
</script>
