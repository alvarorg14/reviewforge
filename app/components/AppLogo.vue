<template>
  <NuxtLink
    :to="to"
    class="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  >
    <img
      :src="iconSrc"
      :alt="`${appName} logo`"
      class="shrink-0 object-contain"
      :class="iconSizeClass"
      width="64"
      height="64"
    >
    <span
      v-if="wordmark"
      class="font-semibold tracking-tight text-highlighted"
      :class="wordmarkClass"
    >
      {{ appName }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Header vs hero */
    size?: 'sm' | 'lg'
    /** Show “ReviewForge” next to the mark */
    wordmark?: boolean
    /** Dashboard home vs marketing home */
    to?: string
  }>(),
  {
    size: 'sm',
    wordmark: true,
    to: '/',
  },
)

const config = useRuntimeConfig()
const appName = computed(() => config.public.appName ?? 'ReviewForge')

const colorMode = useColorMode()
/** Avoid img src hydration mismatch: SSR + first client paint use light mark; then follow theme. */
const logoReady = ref(false)
onMounted(() => {
  logoReady.value = true
})

const iconSrc = computed(() => {
  if (!logoReady.value) return '/brand/icon.png'
  return colorMode.value === 'dark' ? '/brand/icon-dark.png' : '/brand/icon.png'
})

const iconSizeClass = computed(() =>
  props.size === 'lg' ? 'size-14 sm:size-16' : 'size-8',
)

const wordmarkClass = computed(() =>
  props.size === 'lg' ? 'text-xl sm:text-2xl font-bold' : 'text-base',
)
</script>
