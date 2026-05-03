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
        These options apply when you run an AI review from ReviewForge for this repository.
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
          <h2 class="font-semibold">Approvals</h2>
        </template>
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

type SettingsDto = {
  aiContext: string | null
  aiAllowApprove: boolean
  aiReviewStyle: 'concise' | 'thorough' | 'security'
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
  },
  { immediate: true },
)

function resetForm() {
  if (!data.value) return
  form.aiContext = data.value.aiContext ?? ''
  form.aiAllowApprove = data.value.aiAllowApprove
  form.aiReviewStyle = data.value.aiReviewStyle
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
