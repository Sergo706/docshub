<script setup lang="ts">
import { parsePath } from 'ufo';
import LayoutFooter from './components/Layout/LayoutFooter.vue';
import LayoutHeader from './components/Layout/LayoutHeader.vue';
import type { ContentNavigationItem } from '@nuxt/content';

const route = useRoute();
const { data: navLinks } = await useAsyncData<NavigationCollection>('navLinks', async () => {
  return await queryCollection('navigationMenu').first() as unknown as NavigationCollection;
});
provide('navLinks', navLinks);

const baseNavPath = computed(() => {
  const parts = parsePath(route.path).pathname.split('/');
  return parts.slice(0, 3).join('/');
});

const { data } = await useAsyncData<ContentNavigationItem[]>('sidebar_docs_navigation', async () => {
    if (baseNavPath.value.startsWith('/docs')) {
        return await queryCollectionNavigation('docs').where('path', 'LIKE', `%${baseNavPath.value}%`);
    }
    return [] as ContentNavigationItem[];
}, { watch: [baseNavPath] });

provide('sidebar_docs_navigation', data);

</script>

<template>
  <UApp>
    <LayoutHeader />

      
    <UMain class="lg:pt-[calc(var(--ui-header-height))]">
      <NuxtLayout>
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </NuxtLayout>
    </UMain>
      
    <USeparator
      :avatar="{
        src: '/favicon.svg',
        alt: 'Logo',
        loading: 'lazy',
      }"
      color="neutral"
      decorative
    />

    <LayoutFooter />
  </UApp>
</template>