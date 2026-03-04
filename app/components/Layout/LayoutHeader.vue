<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import type { NavigationCollection } from '~~/shared/types/Navigation';
import LayoutSearch from './LayoutSearch.vue';
import type { ContentNavigationItem } from '@nuxt/content';
const route = useRoute();



const navLinks = inject<Ref<NavigationCollection>>('navLinks');
const sidebarDocsNavigation = inject<Ref<ContentNavigationItem[]>>('sidebar_docs_navigation');

const moduleLinks = computed(() => {
  if (!navLinks?.value.links) return [];

  const docsLink = navLinks.value.links.find(link => link.nested && link.to.startsWith('/docs')) as { nested: true, children: NavigationMenuItem[] } | undefined;
  
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


const desktopItems = computed<NavigationMenuItem[]>(() => {
  if (!navLinks?.value.links) return [];
  return navLinks.value.links.map((link): NavigationMenuItem => ({
    label: link.label,
    icon: link.icon,
    to: link.to,
    active: link.nested ? route.path.startsWith(link.to) : route.path === link.to,
  }));
});

const mobileItems = computed<NavigationMenuItem[]>(() => {
  if (!navLinks?.value.links) return [];

  const items = navLinks.value.links.flatMap((link): NavigationMenuItem[] => {
    if (link.nested && link.label.startsWith('Docs')) {
      return link.children.map((child): NavigationMenuItem => ({
        label: child.label,
        icon: child.icon,
        to: child.to,
      }));
    }

    const parentItem: NavigationMenuItem = {
      label: link.label,
      icon: link.icon,
      to: link.to,
      active: link.nested ? route.path.startsWith(link.to) : route.path === link.to,
    };

    if (link.nested) {
      const childItems = link.children.map((child): NavigationMenuItem => ({
        label: child.label,
        icon: child.icon,
        to: child.to,
      }));
      return [parentItem, ...childItems];
    }
    
    return [parentItem];
  });

  items.push({
    label: 'GitHub',
    icon: 'i-lucide-github',
    to: 'https://github.com/Sergo706/docshub',
    target: '_blank',
  });
  
  return items;
});

const navigation = computed(() => {
  const navArray = sidebarDocsNavigation?.value;
  if (!navArray || navArray.length === 0) return [];

  return navArray[0]?.children ?? navArray;
});

</script>

<template>
  <UHeader class="bg-cream-50/90 backdrop-blur dark:bg-riavzon-950/90">
    <template #title>
      <LayoutLogo :is-text="true" />
    </template>

    <UNavigationMenu 
      :items="desktopItems" 
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
        :items="mobileItems"  
        orientation="vertical" 
        class="-mx-2.5" 
      />
      <USeparator 
        type="dashed"
        decorative
        class="mt-5 mb-5"
      />
      <UContentNavigation 
        variant="link"
        highlight
        :navigation="navigation" 
        :default-open="true"
      />
    </template>
    
    <template
      v-if="route.path.startsWith('/docs')"
      #bottom
    >
      <div class="!hidden lg:!block bg-cream-50/90 dark:bg-riavzon-950/90 backdrop-blur border-b border-default px-4 sm:px-6">
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
