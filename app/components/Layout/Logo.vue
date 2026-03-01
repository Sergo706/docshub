<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
const { appName } = useAppConfig();

defineProps({
  isText: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <NuxtLink
    to="/"
    class="flex shrink-0 items-center"
    aria-label="Go back to home page"
  >
    <img
      src="/favicon.svg"
      alt="Logo"
      class="size-8"
    >
    <span
      v-if="isText"
      class="m-2 text-xl font-bold"
    >
      {{ appName }}
    </span>
  </NuxtLink>
</template>