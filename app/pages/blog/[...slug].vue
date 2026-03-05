<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
const route = useRoute();
import { defineArticle, useSchemaOrg, defineBreadcrumb } from '@unhead/schema-org/vue';
import type { ContentNavigationItem } from '@nuxt/content';
import { useBreadCrumbs } from '~~/app/composables/useBreadCrumbs';

const sidebarDocsNavigation = inject<Ref<ContentNavigationItem[]>>('sidebar_docs_navigation');
const mapBread = useBreadCrumbs(route.path, false);

definePageMeta({
  layout: 'blog'
});

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('blog').path(route.path).first();
});

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true });
}

useSchemaOrg([
  defineArticle({
    headline: page.value.title,
    author: { name: page.value.author, url: page.value.authorGithub },
    datePublished: page.value.date,
    dateModified: page.value.date,
    description: page.value.description,
    image: page.value.image,
    inLanguage: 'en',
    publisher: {
      name: 'Riavzon',
      logo: 'https://docs.riavzon.com/favicon.svg'
    }
  }),
  defineBreadcrumb({
    itemListElement: computed(() => {
      const crumbs = mapBread(sidebarDocsNavigation?.value ?? []);
      return crumbs.value.map((crumb, index) => ({
        position: index + 1,
        name: crumb.label,
        item: crumb.to ? `https://docs.riavzon.com${crumb.to}` : ''
      }));
    })
  })
]);
</script>

<template>
  <template v-if="page">
    <SeoMetadata
      :page="page"
      :is-writing="true"
      :image="page.image"
    />
    <ContentRenderer
      v-if="page"
      :value="page"
    />
  </template>
</template>
