<script setup lang="ts">

import type { NavigationMenuItem } from '@nuxt/ui';
import type { NavigationCollection } from '~~/shared/types/Navigation';
const route = useRoute();

const { data: navLinks } = await useAsyncData<NavigationCollection>('navLinks', async () => {
  return await queryCollection('navigationMenu').first() as unknown as NavigationCollection;
});


const items = computed<NavigationMenuItem[]>(() => {
  if (!navLinks.value?.links) return [];

  const rawLinks = navLinks.value.links;
  
  return rawLinks.map((link): NavigationMenuItem => {
    if (link.nested) {
      return {
        label: link.label,
        to: link.to,
        active: route.path.startsWith(link.to),
        target: '_blank',
      };
    }

    return {
      label: link.label,
      to: link.to,
      active: route.path === link.to,
    };
  });
});

</script>

<template>
  <UFooter>
    <template #left>
      <p class="text-muted text-sm">
        Copyright Sergey Riavzon © {{ new Date().getFullYear() }}
      </p>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <UButton
        icon="i-simple-icons-linkedin"
        color="neutral"
        variant="ghost"
        to="https://www.linkedin.com/in/sergey-riavzon-b5a50737b"
        target="_blank"
        aria-label="LinkedIn"
      />
      <UButton
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        to="https://github.com/Sergo706"
        target="_blank"
        aria-label="GitHub"
      />
    </template>
  </UFooter>
</template>
