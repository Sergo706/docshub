<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import type { NavigationCollection } from '~~/shared/types/Navigation';
import LayoutSearch from './LayoutSearch.vue';
const route = useRoute();

const { data: navLinks } = await useAsyncData<NavigationCollection>('navLinks', async () => {
  return await queryCollection('navigationMenu').first() as unknown as NavigationCollection;
});


const items = computed<NavigationMenuItem[]>(() => {
  const baseItems: NavigationMenuItem[] = [];

  if (navLinks.value?.links) {
    const rawLinks = navLinks.value.links;
    
    baseItems.push(...rawLinks.map((link): NavigationMenuItem => {
      if (link.nested) {
        return {
          label: link.label,
          icon: link.icon,
          to: link.to,
          active: route.path.startsWith(link.to),
          target: '_blank',
          children: link.children.map((child): NavigationMenuItem => ({
            label: child.label,
            icon: child.icon,
            to: child.to,
          })),
        };
      }

      return {
        label: link.label,
        icon: link.icon,
        to: link.to,
        active: route.path === link.to,
      };
    }));
  }
  baseItems.push({
    label: 'GitHub',
    icon: 'i-lucide-github',
    to: 'https://github.com/Sergo706/docshub',
    target: '_blank',
    class: 'lg:hidden'
  });

  return baseItems;
});
</script>

<template>
  <UHeader>
    <template #title>
      <LayoutLogo :is-text="true" />
    </template>

    <UNavigationMenu 
      :items="items" 
      content-orientation="vertical"
    />

    <template #right>
      <LayoutSearch />

      <ClientOnly>
        <UColorModeButton />
        <template #fallback>
          <div class="w-8 h-8" />
        </template>
      </ClientOnly>

      <UButton
        color="neutral"
        variant="ghost"
        to="https://github.com/Sergo706/docshub"
        target="_blank"
        icon="i-lucide-github"
        aria-label="GitHub"
        class="hidden lg:flex"
      />
    </template>
    <template #body>
      <UNavigationMenu 
        :items="items" 
        orientation="vertical" 
        class="-mx-2.5" 
      />
    </template>
  </UHeader>
</template>
