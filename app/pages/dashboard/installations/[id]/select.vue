<template>
  <div class="space-y-8">
    <div>
      <UButton to="/dashboard" variant="ghost" icon="i-lucide-arrow-left" size="sm">
        Dashboard
      </UButton>
      <h1 class="mt-4 text-2xl font-bold tracking-tight">Import repositories</h1>
      <p class="mt-1 text-muted">
        Choose which repositories to show for
        <strong v-if="data?.accountLogin">{{ data.accountLogin }}</strong>
        <span v-else>this installation</span>. Only selected repos appear on your dashboard.
      </p>
    </div>

    <UAlert
      v-if="!githubAppSlug"
      color="warning"
      variant="subtle"
      title="GitHub App slug missing"
      description="Set NUXT_PUBLIC_GITHUB_APP_SLUG so we can link you back to GitHub to grant repository access."
    />

    <UAlert
      v-if="importError"
      color="error"
      variant="subtle"
      title="Could not save"
      :description="importError"
    />

    <div v-if="pending" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-dimmed" />
    </div>

    <template v-else-if="data">
      <EmptyState
        v-if="!data.repositories?.length"
        title="No repositories available yet"
        description="Grant this GitHub App access to at least one repository (for example from “Only select repositories”), then return here."
      >
        <UButton
          :to="installUrl"
          :disabled="!githubAppSlug"
          icon="i-simple-icons-github"
        >
          Configure on GitHub
        </UButton>
      </EmptyState>

      <template v-else>
        <div class="flex flex-wrap items-center gap-2">
          <UButton size="sm" variant="soft" @click="selectAll">Select all</UButton>
          <UButton size="sm" variant="soft" @click="deselectAll">Deselect all</UButton>
          <UButton
            :loading="importPending"
            :disabled="importPending"
            class="ms-auto"
            @click="submitImport"
          >
            Import repositories
          </UButton>
        </div>

        <ul class="space-y-2">
          <li v-for="repo in data.repositories" :key="repo.githubRepoId">
            <label
              class="bg-elevated/50 flex cursor-pointer items-center gap-3 rounded-lg border border-default p-4 transition-colors hover:border-muted"
            >
              <input
                type="checkbox"
                class="border-accented text-primary focus:ring-primary size-4 shrink-0 rounded"
                :checked="selected.has(repo.githubRepoId)"
                @change="toggle(repo.githubRepoId)"
              >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <UIcon
                    :name="repo.private ? 'i-lucide-lock' : 'i-lucide-book-marked'"
                    class="size-4 shrink-0 text-dimmed"
                  />
                  <span class="truncate font-medium">{{ repo.fullName }}</span>
                  <UBadge v-if="repo.private" color="neutral" variant="subtle" size="xs">
                    Private
                  </UBadge>
                  <UBadge v-if="repo.imported" color="primary" variant="subtle" size="xs">
                    Imported
                  </UBadge>
                </div>
                <p v-if="repo.defaultBranch" class="mt-1 text-xs text-dimmed">
                  Default: {{ repo.defaultBranch }}
                </p>
              </div>
            </label>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const config = useRuntimeConfig()
const requestFetch = useRequestFetch()

const installationId = computed(() => {
  const raw = route.params.id
  const v = Array.isArray(raw) ? raw[0] : raw
  return v ? String(v) : ''
})

const githubAppSlug = computed(() => config.public.githubAppSlug)

const installUrl = computed(() => {
  const slug = githubAppSlug.value
  if (!slug) return '#'
  return `https://github.com/apps/${slug}/installations/new`
})

const { data, pending } = await useFetch(
  () => `/api/installations/${installationId.value}/available-repos`,
  {
    watch: [installationId],
  },
)

const selected = ref(new Set())
const importPending = ref(false)
const importError = ref('')

watch(
  () => data.value?.repositories,
  (repos) => {
    if (!repos?.length) {
      selected.value = new Set()
      return
    }
    selected.value = new Set(
      repos.filter((r) => r.imported).map((r) => r.githubRepoId),
    )
  },
  { immediate: true },
)

function toggle(githubRepoId) {
  const next = new Set(selected.value)
  if (next.has(githubRepoId)) next.delete(githubRepoId)
  else next.add(githubRepoId)
  selected.value = next
}

function selectAll() {
  const repos = data.value?.repositories ?? []
  selected.value = new Set(repos.map((r) => r.githubRepoId))
}

function deselectAll() {
  selected.value = new Set()
}

async function submitImport() {
  importError.value = ''
  importPending.value = true
  try {
    await requestFetch(`/api/installations/${installationId.value}/repos/import`, {
      method: 'POST',
      body: { githubRepoIds: [...selected.value] },
    })
    await navigateTo('/dashboard')
  } catch (e) {
    importError.value =
      e?.data?.message ?? e?.message ?? 'Something went wrong. Try again.'
  } finally {
    importPending.value = false
  }
}
</script>
