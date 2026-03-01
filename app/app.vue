<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content';

const { data: navigation } = await useAsyncData('navigation', () =>
  queryCollectionNavigation('content')
);

provide<Ref<ContentNavigationItem[] | null>>('navigation', navigation);
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>