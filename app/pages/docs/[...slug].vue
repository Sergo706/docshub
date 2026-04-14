<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { defineBreadcrumb, useSchemaOrg } from '@unhead/schema-org/vue';
import type { ContentNavigationItem } from '@nuxt/content';
import { useBreadCrumbs } from '~~/app/composables/useBreadCrumbs';

const route = useRoute();
const sidebarDocsNavigation = inject<Ref<ContentNavigationItem[]>>('sidebar_docs_navigation');
const mapBread = useBreadCrumbs(route.path, false);

definePageMeta({
  layout: 'docs'
});

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('docs').path(route.path).first();
});

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}
const crumbs = mapBread(sidebarDocsNavigation?.value ?? []).value;
const schemaBreadcrumbs = crumbs.map((crumb, index) => ({
  position: index + 1,
  name: crumb.label,
  item: crumb.to ? `https://docs.riavzon.com${crumb.to}` : '',
}));

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: schemaBreadcrumbs,
  }),
]);

if (import.meta.server) {
  defineOgImage('Image', {
    title: page.value.title,
    description: page.value.description,
  });
}

</script>

<template>
  <template v-if="page">
    <SeoMetadata
      :page
      :is-writing="false"
    />
    <ContentRenderer :value="page" />
  </template>
</template>
