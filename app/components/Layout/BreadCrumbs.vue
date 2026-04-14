<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content';
import { useBreadCrumbs } from '~~/app/composables/useBreadCrumbs';


const sidebarDocsNavigation = inject<Ref<ContentNavigationItem[]>>('sidebar_docs_navigation');
const route = useRoute();
const mapped = computed(() => {
    const mapBread = useBreadCrumbs(route.path, true);
    return mapBread(sidebarDocsNavigation?.value ?? []).value;
});

</script>

<template>
  <UBreadcrumb :items="mapped" /> 
</template>