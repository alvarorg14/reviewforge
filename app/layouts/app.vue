<template>
  <div class="min-h-dvh flex flex-col">
    <header
      class="sticky top-0 z-40 border-b border-default bg-background/80 backdrop-blur"
    >
      <UContainer class="flex h-14 items-center justify-between gap-4">
        <NuxtLink to="/app" class="font-semibold tracking-tight">
          {{ appName }}
        </NuxtLink>
        <nav class="flex items-center gap-2">
          <UButton to="/app" variant="ghost" color="neutral" size="sm">
            Dashboard
          </UButton>
          <UButton to="/app/settings" variant="ghost" color="neutral" size="sm">
            Settings
          </UButton>
          <UserMenu />
        </nav>
      </UContainer>
    </header>
    <main class="flex-1 py-8">
      <UContainer>
        <slot />
      </UContainer>
    </main>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const appName = computed(() => config.public.appName)
</script>
