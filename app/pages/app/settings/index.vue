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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app' })

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
