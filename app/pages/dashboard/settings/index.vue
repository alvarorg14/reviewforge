<template>
  <div class="mx-auto max-w-2xl space-y-8">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Settings</h1>
      <p class="mt-1 text-muted">
        GitHub connection and environment hints for self-hosting.
      </p>
    </div>

    <UCard>
      <template #header>
        <h2 class="font-semibold">GitHub App</h2>
      </template>
      <p class="text-sm text-muted">
        Webhook URL should point to
        <code class="rounded bg-muted px-1 py-0.5 text-xs">{{ webhookUrl }}</code>
        with JSON payloads. Subscribe to
        <strong>Installation</strong> and
        <strong>Installation repositories</strong> events.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <UButton :to="installUrl" :disabled="!githubAppSlug" variant="soft">
          Add or manage installation
        </UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">OAuth App</h2>
      </template>
      <p class="text-sm text-muted">
        Authorization callback URL:
        <code class="rounded bg-muted px-1 py-0.5 text-xs">{{ oauthCallback }}</code>
      </p>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">Cursor API key</h2>
      </template>
      <p class="text-sm text-muted">
        Used to run AI reviews on your behalf via the Cursor SDK. Create a key at
        <a
          href="https://cursor.com/settings"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline-offset-2 hover:underline"
        >cursor.com/settings</a>.
      </p>

      <div v-if="keyPending" class="mt-4 flex justify-center py-6">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-dimmed" />
      </div>

      <p v-else-if="keyFetchError" class="mt-4 text-sm text-error">
        Could not load key status. Ensure
        <code class="rounded bg-muted px-1 text-xs">NUXT_ENCRYPTION_KEY</code>
        is set (32+ characters) on the server.
      </p>

      <template v-else-if="keyMeta">
        <div v-if="keyMeta.hasKey && !replacing" class="mt-4 space-y-3">
          <div>
            <p class="text-xs font-medium text-muted">
              Saved key
            </p>
            <p class="mt-1 font-mono text-sm">
              ••••••••{{ keyMeta.maskedSuffix ?? '' }}
            </p>
            <p v-if="keyMeta.updatedAt" class="mt-1 text-xs text-muted">
              Updated {{ formatKeyDate(keyMeta.updatedAt) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton variant="soft" color="neutral" @click="startReplace">
              Replace
            </UButton>
            <UButton
              variant="soft"
              color="error"
              :loading="removingKey"
              @click="removeKey"
            >
              Remove
            </UButton>
          </div>
        </div>

        <div v-else class="mt-4 space-y-3">
          <UInput
            v-model="keyForm"
            type="password"
            autocomplete="off"
            placeholder="Paste your Cursor API key"
            class="w-full font-mono text-sm"
          />
          <div class="flex flex-wrap gap-2">
            <UButton :loading="savingKey" @click="saveKey">
              Save
            </UButton>
            <UButton
              v-if="keyMeta.hasKey && replacing"
              variant="ghost"
              color="neutral"
              :disabled="savingKey"
              @click="cancelReplace"
            >
              Cancel
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const toast = useToast()

type CursorKeyMeta = {
  hasKey: boolean
  updatedAt: string | null
  maskedSuffix: string | null
}

const {
  data: keyMeta,
  pending: keyPending,
  error: keyFetchError,
  refresh: refreshKeyMeta,
} = await useFetch<CursorKeyMeta>('/api/me/cursor-key', { server: true })

const keyForm = ref('')
const replacing = ref(false)
const savingKey = ref(false)
const removingKey = ref(false)

function formatKeyDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function startReplace() {
  replacing.value = true
  keyForm.value = ''
}

function cancelReplace() {
  replacing.value = false
  keyForm.value = ''
}

async function saveKey() {
  const trimmed = keyForm.value.trim()
  if (trimmed.length < 20) {
    toast.add({
      title: 'Key too short',
      description: 'API key must be at least 20 characters.',
      color: 'error',
    })
    return
  }
  savingKey.value = true
  try {
    await $fetch('/api/me/cursor-key', {
      method: 'PUT',
      body: { apiKey: trimmed },
    })
    keyForm.value = ''
    replacing.value = false
    await refreshKeyMeta()
    toast.add({ title: 'Cursor API key saved', color: 'success' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    toast.add({
      title: 'Could not save key',
      description: err.data?.message ?? err.message ?? 'Unknown error',
      color: 'error',
    })
  } finally {
    savingKey.value = false
  }
}

async function removeKey() {
  removingKey.value = true
  try {
    await $fetch('/api/me/cursor-key', { method: 'DELETE' })
    keyForm.value = ''
    replacing.value = false
    await refreshKeyMeta()
    toast.add({ title: 'Cursor API key removed', color: 'success' })
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    toast.add({
      title: 'Could not remove key',
      description: err.data?.message ?? err.message ?? 'Unknown error',
      color: 'error',
    })
  } finally {
    removingKey.value = false
  }
}

const config = useRuntimeConfig()
const githubAppSlug = computed(() => config.public.githubAppSlug)
const base = computed(() => config.public.baseUrl?.replace(/\/$/, '') ?? '')

const webhookUrl = computed(() => `${base.value}/api/webhooks/github`)
const oauthCallback = computed(() => `${base.value}/auth/github`)

const installUrl = computed(() => {
  const slug = githubAppSlug.value
  if (!slug) return '#'
  return `https://github.com/apps/${slug}/installations/new`
})
</script>
