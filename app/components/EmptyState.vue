<template>
  <UCard :ui="{ body: 'py-10 text-center' }">
    <UIcon name="i-lucide-inbox" class="mx-auto size-10 text-dimmed" />
    <p class="mt-3 text-muted">{{ title }}</p>
    <p v-if="description" class="mt-1 text-sm text-dimmed">{{ description }}</p>
    <div v-if="$slots.default" class="mt-6 flex justify-center">
      <slot />
    </div>
  </UCard>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: false, default: undefined },
})
</script>
