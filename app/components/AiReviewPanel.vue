<template>
  <div class="rounded-lg border border-default bg-elevated/30 p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold text-ai-gradient">AI review (Cursor)</h2>
        <p class="mt-0.5 text-xs text-muted">
          Posts inline comments and a review on GitHub via the GitHub MCP.
        </p>
      </div>
      <UButton
        icon="i-lucide-sparkles"
        :loading="triggering"
        :disabled="isBusy || triggering"
        color="neutral"
        variant="solid"
        class="!bg-ai-gradient !text-white shadow-sm ring-0 hover:!brightness-110 focus-visible:!ring-white/40"
        @click="onTrigger"
      >
        Run AI review
      </UButton>
    </div>

    <div v-if="conflictRunId" class="mt-3 text-xs text-amber-600 dark:text-amber-400">
      A review is already running (run #{{ conflictRunId }}).
    </div>

    <div
      v-if="cursorKeyHint"
      class="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-xs text-error"
    >
      <span>Add your Cursor API key in Settings to run reviews.</span>
      <UButton to="/dashboard/settings" size="xs" variant="soft" color="error">
        Open Settings
      </UButton>
    </div>

    <div v-if="latest" class="mt-4 space-y-2 text-sm">
      <div class="flex flex-wrap items-center gap-2">
        <UBadge
          :color="statusBadgeColor(latest.status)"
          variant="subtle"
          size="xs"
        >
          {{ latest.status }}
        </UBadge>
        <span v-if="isActiveStatus(latest.status)" class="inline-flex items-center gap-1 text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
          {{ activeLabel }}
        </span>
      </div>
      <div v-if="latest.summary && isTerminalSuccess(latest.status)" class="space-y-1">
        <p class="text-xs font-medium text-muted">Summary</p>
        <MarkdownContent :source="latest.summary" />
      </div>
      <p v-if="latest.error" class="text-error text-xs">
        {{ latest.error }}
      </p>
      <div v-if="latest.cursorAgentId" class="font-mono text-xs text-dimmed">
        Agent: {{ latest.cursorAgentId }}
      </div>
      <UButton
        :to="githubPrUrl"
        target="_blank"
        external
        variant="link"
        size="xs"
        class="p-0"
        icon="i-lucide-external-link"
      >
        View pull request on GitHub
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'

const toast = useToast()

const props = defineProps<{
  owner: string
  name: string
  number: string
}>()

type RunRow = {
  id: number
  status: string
  summary: string | null
  error: string | null
  createdAt: Date | string | null
  finishedAt: Date | string | null
  cursorAgentId: string | null
}

const githubPrUrl = computed(
  () =>
    `https://github.com/${encodeURIComponent(props.owner)}/${encodeURIComponent(props.name)}/pull/${encodeURIComponent(props.number)}`,
)

const basePath = computed(
  () =>
    `/api/repos/${encodeURIComponent(props.owner)}/${encodeURIComponent(props.name)}/pulls/${encodeURIComponent(props.number)}`,
)

const { data: latest, refresh } = await useFetch<RunRow | null>(
  () => `${basePath.value}/ai-reviews/latest`,
  { server: true },
)

const triggering = ref(false)
const conflictRunId = ref<number | null>(null)
const cursorKeyHint = ref(false)

const isBusy = computed(() =>
  latest.value ? isActiveStatus(latest.value.status) : false,
)

const startedAt = ref<number | null>(null)
const elapsedTick = ref(0)

const activeLabel = computed(() => {
  void elapsedTick.value
  if (!startedAt.value) return 'Starting…'
  const sec = Math.max(0, Math.floor((Date.now() - startedAt.value) / 1000))
  return `Running… (${sec}s)`
})

const { pause, resume } = useIntervalFn(
  () => {
    elapsedTick.value += 1
    void refresh()
  },
  3000,
  { immediate: false },
)

watch(
  () => latest.value?.status,
  (s) => {
    if (s && isActiveStatus(s)) {
      if (!startedAt.value) startedAt.value = Date.now()
      resume()
    } else {
      startedAt.value = null
      pause()
    }
  },
  { immediate: true },
)

function isActiveStatus(s: string) {
  return s === 'pending' || s === 'running'
}

function isTerminalSuccess(s: string) {
  return s === 'succeeded' || s === 'cancelled'
}

function statusBadgeColor(s: string) {
  if (s === 'succeeded') return 'success' as const
  if (s === 'failed') return 'error' as const
  if (s === 'cancelled') return 'neutral' as const
  return 'warning' as const
}

async function onTrigger() {
  conflictRunId.value = null
  cursorKeyHint.value = false
  triggering.value = true
  try {
    await $fetch<{ runId: number }>(`${basePath.value}/ai-reviews`, {
      method: 'POST',
    })
    startedAt.value = Date.now()
    await refresh()
    resume()
  } catch (e: unknown) {
    const err = e as {
      statusCode?: number
      status?: number
      data?: { message?: string; runId?: number }
      message?: string
    }
    const code = err.statusCode ?? err.status
    if (code === 409 && err.data?.runId != null) {
      conflictRunId.value = err.data.runId
    } else if (code === 400) {
      const msg =
        typeof err.data?.message === 'string'
          ? err.data.message
          : (err.message ?? '')
      if (msg.includes('Cursor API key')) {
        cursorKeyHint.value = true
        toast.add({
          title: 'Cursor API key required',
          description:
            'Add your key under Dashboard → Settings, then try again.',
          color: 'error',
        })
      }
    }
    await refresh()
  } finally {
    triggering.value = false
  }
}
</script>
