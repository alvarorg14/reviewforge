<template>
  <div>
    <section class="relative overflow-hidden border-b border-default">
      <UContainer class="py-20 sm:py-28">
        <div class="mx-auto max-w-2xl text-center">
          <UBadge color="primary" variant="subtle" class="mb-4">
            Open source
          </UBadge>
          <h1
            class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-highlighted"
          >
            Your GitHub pull requests,
            <span class="text-primary">forged</span> into clarity
          </h1>
          <p class="mt-5 text-lg text-muted">
            ReviewForge connects to your repositories via a GitHub App, lists
            pull requests per repo, and is built to grow into AI-assisted reviews
            and deployment insights.
          </p>
          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <UButton
              v-if="!loggedIn"
              to="/auth/github"
              external
              size="lg"
              icon="i-simple-icons-github"
            >
              Continue with GitHub
            </UButton>
            <UButton v-else to="/app" size="lg" color="primary">
              Open dashboard
            </UButton>
            <UButton
              v-if="loggedIn"
              to="/app/settings"
              size="lg"
              color="neutral"
              variant="outline"
            >
              Setup &amp; hosting
            </UButton>
          </div>
          <p v-if="route.query.error" class="mt-6 text-sm text-error">
            Sign-in failed. Please try again.
          </p>
        </div>
      </UContainer>
    </section>

    <UContainer class="py-16">
      <div class="grid gap-8 sm:grid-cols-3">
        <UCard>
          <UIcon name="i-lucide-shield-check" class="size-8 text-primary" />
          <h2 class="mt-3 font-semibold">GitHub SSO</h2>
          <p class="mt-2 text-sm text-muted">
            Sign in with GitHub OAuth. Your tokens stay on the server.
          </p>
        </UCard>
        <UCard>
          <UIcon name="i-lucide-git-branch" class="size-8 text-primary" />
          <h2 class="mt-3 font-semibold">Repo-scoped access</h2>
          <p class="mt-2 text-sm text-muted">
            Install the GitHub App and pick exactly which repositories to import.
          </p>
        </UCard>
        <UCard>
          <UIcon name="i-lucide-sparkles" class="size-8 text-primary" />
          <h2 class="mt-3 font-semibold">Ready for AI reviews</h2>
          <p class="mt-2 text-sm text-muted">
            Architecture is prepared for Cursor SDK and future providers.
          </p>
        </UCard>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const { loggedIn, fetch } = useUserSession()

onMounted(() => {
  void fetch()
})
</script>
