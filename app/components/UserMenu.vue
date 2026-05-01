<template>
  <div>
    <UButton
      v-if="!loggedIn"
      to="/auth/github"
      external
      icon="i-simple-icons-github"
      color="neutral"
      variant="solid"
      size="sm"
    >
      Sign in
    </UButton>
    <UDropdownMenu v-else :items="items">
      <UButton color="neutral" variant="ghost" class="gap-2" size="sm">
        <UAvatar :src="user?.avatarUrl ?? undefined" :alt="user?.login" size="2xs" />
        <span class="hidden sm:inline">{{ user?.login }}</span>
      </UButton>
    </UDropdownMenu>
  </div>
</template>

<script setup lang="ts">
const { loggedIn, user, clear, fetch } = useUserSession()

onMounted(() => {
  void fetch()
})

const items = computed(() => [
  [
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      to: '/app',
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/app/settings',
    },
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      onSelect: () => void clear(),
    },
  ],
])
</script>
