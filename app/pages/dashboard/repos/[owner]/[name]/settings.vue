<template>
  <div class="mx-auto max-w-2xl space-y-8 py-8">
    <div>
      <UButton
        :to="pullsUrl"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        class="-ml-2 mb-4"
      >
        Back to pull requests
      </UButton>
      <h1 class="text-2xl font-bold tracking-tight">
        AI review settings
      </h1>
      <p class="mt-1 font-mono text-sm text-muted">
        {{ owner }}/{{ name }}
      </p>
      <p class="mt-2 text-sm text-muted">
        These options apply when you run an AI review from ReviewForge for this repository, including
        <strong>automated</strong> runs on new PRs when enabled below.
        They are injected into the review agent prompt.
      </p>
    </div>

    <UCard v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-dimmed" />
    </UCard>

    <template v-else-if="data">
      <UCard>
        <template #header>
          <h2 class="font-semibold">Repository context</h2>
        </template>
        <p class="text-sm text-muted">
          Markdown describing stack, conventions, and what reviewers should prioritize.
          Shown to the agent as repository-specific context (max {{ maxLen }} characters).
        </p>
        <UTextarea
          v-model="form.aiContext"
          class="mt-4 w-full font-mono text-sm"
          :rows="12"
          autoresize
          placeholder="e.g. Primary language, framework, testing approach, security requirements…"
        />
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">Review style</h2>
        </template>
        <p class="text-sm text-muted">
          Adjusts how deep the rubric is in the agent prompt.
        </p>
        <USelect
          v-model="form.aiReviewStyle"
          :items="styleItems"
          class="mt-4 w-full max-w-md"
          value-key="value"
          label-key="label"
        />
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">Automated reviews</h2>
        </template>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="font-medium">
                Run AI review when a PR is opened
              </p>
              <p class="mt-1 text-sm text-muted">
                Triggers on <strong>opened</strong>, <strong>reopened</strong>, and when a draft becomes
                <strong>ready for review</strong>. Draft PRs are skipped until they leave draft.
              </p>
            </div>
            <USwitch v-model="form.autoReviewEnabled" />
          </div>
          <div>
            <p class="text-sm text-muted">
              Reviewer account (whose stored <span class="font-mono">Cursor</span> API key is used)
            </p>
            <USelect
              v-model="form.reviewerAccountValue"
              :items="reviewerItems"
              :disabled="!form.autoReviewEnabled"
              class="mt-2 w-full max-w-md"
              value-key="value"
              label-key="label"
            />
            <p
              v-if="autoReviewWarning"
              class="mt-2 text-sm text-amber-600 dark:text-amber-400"
            >
              {{ autoReviewWarning }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-medium">
              Allow agent to approve PRs
            </p>
            <p class="mt-1 text-sm text-muted">
              When off, the prompt instructs the agent to never submit an
              <strong>APPROVE</strong> review on GitHub (only request changes or comment).
            </p>
          </div>
          <USwitch v-model="form.aiAllowApprove" />
        </div>
      </UCard>

      <div class="flex justify-end gap-2">
        <UButton variant="soft" color="neutral" :disabled="saving" @click="resetForm">
          Reset
        </UButton>
        <UButton :loading="saving" @click="save">
          Save
        </UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { AI_CONTEXT_MAX_LENGTH } from '#shared/aiRepoSettings'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const toast = useToast()

const owner = computed(() => String(route.params.owner))
const name = computed(() => String(route.params.name))

const pullsUrl = computed(
  () => `/dashboard/repos/${owner.value}/${name.value}/pulls`,
)

const settingsApi = computed(
  () =>
    `/api/repos/${encodeURIComponent(owner.value)}/${encodeURIComponent(name.value)}/settings`,
)

/** Sentinel: use installation default reviewer (see server webhook resolution). */
const USE_INSTALLATION_DEFAULT = -1

type CandidateUser = { id: number; login: string; name: string | null }

type SettingsDto = {
  aiContext: string | null
  aiAllowApprove: boolean
  aiReviewStyle: 'concise' | 'thorough' | 'security'
  autoReviewEnabled: boolean
  autoReviewUserId: number | null
  installationDefaultAutoReviewUserId: number | null
  candidates: CandidateUser[]
}

const { data, pending, refresh } = await useFetch<SettingsDto>(settingsApi, {
  watch: [settingsApi],
  server: true,
})

const maxLen = AI_CONTEXT_MAX_LENGTH

const form = reactive({
  aiContext: '',
  aiAllowApprove: true,
  aiReviewStyle: 'thorough' as SettingsDto['aiReviewStyle'],
  autoReviewEnabled: false,
  /** {@link USE_INSTALLATION_DEFAULT} or a user id from `candidates`. */
  reviewerAccountValue: USE_INSTALLATION_DEFAULT,
})

const reviewerItems = computed(() => {
  const items: { label: string; value: number }[] = [
    {
      label: 'Installation default (first linked user with a Cursor key)',
      value: USE_INSTALLATION_DEFAULT,
    },
  ]
  const c = data.value?.candidates
  if (!c?.length) return items
  for (const u of c) {
    const namePart = u.name ? ` — ${u.name}` : ''
    items.push({ label: `${u.login}${namePart}`, value: u.id })
  }
  return items
})

const autoReviewWarning = computed(() => {
  const d = data.value
  if (!d || !form.autoReviewEnabled) return ''
  if (!d.candidates?.length) {
    return 'Nobody linked to this installation has stored a Cursor API key in ReviewForge. Automated reviews will fail until someone adds a key under Settings.'
  }
  const usingInstallDefault =
    form.reviewerAccountValue === USE_INSTALLATION_DEFAULT
  if (
    usingInstallDefault &&
    d.installationDefaultAutoReviewUserId == null
  ) {
    return 'No installation default reviewer is set yet. Link this GitHub App from ReviewForge with an account that has a Cursor API key, or pick a reviewer below.'
  }
  return ''
})

const styleItems = [
  { label: 'Thorough', value: 'thorough' },
  { label: 'Concise', value: 'concise' },
  { label: 'Security-focused', value: 'security' },
]

watch(
  data,
  (d) => {
    if (!d) return
    form.aiContext = d.aiContext ?? ''
    form.aiAllowApprove = d.aiAllowApprove
    form.aiReviewStyle = d.aiReviewStyle
    form.autoReviewEnabled = d.autoReviewEnabled
    form.reviewerAccountValue =
      d.autoReviewUserId ?? USE_INSTALLATION_DEFAULT
  },
  { immediate: true },
)

function resetForm() {
  if (!data.value) return
  form.aiContext = data.value.aiContext ?? ''
  form.aiAllowApprove = data.value.aiAllowApprove
  form.aiReviewStyle = data.value.aiReviewStyle
  form.autoReviewEnabled = data.value.autoReviewEnabled
  form.reviewerAccountValue =
    data.value.autoReviewUserId ?? USE_INSTALLATION_DEFAULT
}

const saving = ref(false)

async function save() {
  saving.value = true
  try {
    await $fetch<SettingsDto>(settingsApi.value, {
      method: 'PATCH',
      body: {
        aiContext: form.aiContext.trim() === '' ? null : form.aiContext,
        aiAllowApprove: form.aiAllowApprove,
        aiReviewStyle: form.aiReviewStyle,
        autoReviewEnabled: form.autoReviewEnabled,
        autoReviewUserId:
          form.reviewerAccountValue === USE_INSTALLATION_DEFAULT
            ? null
            : form.reviewerAccountValue,
      },
    })
    await refresh()
    toast.add({ title: 'Settings saved', color: 'success' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    toast.add({
      title: 'Could not save',
      description: err.data?.message ?? err.message ?? 'Unknown error',
      color: 'error',
    })
  } finally {
    saving.value = false
  }
}
</script>
