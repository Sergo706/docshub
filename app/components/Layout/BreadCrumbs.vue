<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content';
import { mapContentNavigation } from '@nuxt/ui/utils/content';
import { findPageBreadcrumb } from '@nuxt/content/utils';

const sidebarDocsNavigation = inject<Ref<ContentNavigationItem[]>>('sidebar_docs_navigation');
const route = useRoute();

const bread = computed(() => {
    if (!sidebarDocsNavigation?.value.length) return [];

    const navigation: ContentNavigationItem[] = sidebarDocsNavigation.value;
    const crumbs = findPageBreadcrumb(navigation, route.path, { indexAsChild: true, current: true }) as ContentNavigationItem[];
    return mapContentNavigation(crumbs, { deep: 0 })
        .map(item => item.label === 'Docs' ? { ...item, to: '/docs/getting-started' } : item)
        .filter((item, index, self) => self.findIndex(i => i.label === item.label) === index);
});



</script>

<template>
  <UBreadcrumb :items="bread" />
</template>