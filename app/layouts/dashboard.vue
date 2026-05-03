<template>
  <div class="min-h-dvh flex flex-col">
    <header
      class="sticky top-0 z-40 border-b border-default bg-background/80 text-default backdrop-blur"
    >
      <UContainer class="flex h-14 items-center justify-between gap-4">
        <AppLogo to="/" />
        <nav class="flex items-center gap-2">
          <UButton to="/dashboard" variant="ghost" color="neutral" size="sm">
            Dashboard
          </UButton>
          <UButton to="/dashboard/settings" variant="ghost" color="neutral" size="sm">
            Settings
          </UButton>
          <ColorModeSwitch />
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
