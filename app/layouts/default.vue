<template>
  <div class="min-h-dvh flex flex-col">
    <header
      class="sticky top-0 z-40 border-b border-default bg-background/80 text-default backdrop-blur"
    >
      <UContainer class="flex h-14 items-center justify-between">
        <AppLogo to="/" />
        <div class="flex items-center gap-2">
          <ColorModeSwitch />
          <UserMenu />
        </div>
      </UContainer>
    </header>
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
