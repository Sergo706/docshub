<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import type { NavigationCollection } from '~~/shared/types/Navigation';
import LayoutSearch from './LayoutSearch.vue';
const route = useRoute();



const navLinks = inject<NavigationCollection>('navLinks');
  
const items = computed<NavigationMenuItem[]>(() => {
  const baseItems: NavigationMenuItem[] = [];

  if (navLinks?.links) {
    const rawLinks = navLinks.links;
    
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

const moduleLinks = computed(() => {
  if (!navLinks?.links) return [];

  const docsLink = navLinks.links.find(link => link.nested && link.to === '/docs') as { nested: true, children: NavigationMenuItem[] } | undefined;
  
  if (docsLink?.children) {
    return docsLink.children.map((child: NavigationMenuItem) => ({
      label: child.label,
      icon: child.icon as string,
      to: child.to as string,
      active: route.path.startsWith(child.to as string)
    }));
  }
  
  return [];
});

</script>

<template>
  <UHeader class="bg-cream-50/90 dark:bg-riavzon-950/90">
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
    
    <template
      v-if="route.path.startsWith('/docs')"
      #bottom
    >
      <div class="bg-cream-50/90 dark:bg-riavzon-950/90 backdrop-blur border-b border-default px-4 sm:px-6 ">
        <UContainer class="flex justify-start">
          <UNavigationMenu 
            :items="moduleLinks" 
            variant="link"
            highlight
            class="-mb-px" 
          />
        </UContainer>
      </div>
    </template>
  </UHeader>
</template>
