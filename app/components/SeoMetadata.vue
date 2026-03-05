<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import type { BlogCollectionItem, PageCollectionItemBase } from "@nuxt/content";
import { joinURL } from 'ufo';

interface SeoConfig {
  title: string;
  description: string;
  url: string;
}

interface ProfileConfig {
  name: string;
}

const { page, isWriting, image } = defineProps<{
  page: PageCollectionItemBase | BlogCollectionItem
  isWriting: boolean
  image?: string,
}>();

const route = useRoute();
const appConfig = useAppConfig();
const seo = appConfig.seo as SeoConfig;
const profile = appConfig.profile as ProfileConfig;

const canonicalUrl = joinURL(seo.url, route.path);

const pageSEO = computed((): { title: string; description: string } => ({
  title: isWriting ? page.title : page.title || seo.title,
  description: isWriting ? page.description : page.description || seo.description,
}));

const getTitleTemplate = (titleChunk: string | undefined): string => {
  if (route.path === '/') return titleChunk ?? seo.title;
  if (isWriting) return titleChunk ?? '';
  return titleChunk ? `${titleChunk} | ${seo.title}` : seo.title;
};
useSeoMeta({
  ogTitle: () => pageSEO.value.title,
  ogDescription: () => pageSEO.value.description,
  ogType: isWriting ? 'article' : 'website',
  ogUrl: () => canonicalUrl,
  ogLocale: 'en_US',
  author: () => profile.name,
  title: () => pageSEO.value.title,
  description: () => pageSEO.value.description,
  twitterTitle: () => pageSEO.value.title,
  twitterDescription: () => pageSEO.value.description,
  twitterCard: 'summary_large_image',
  ...(isWriting && {
    articleAuthor: [profile.name],
  }),
});

useHead({
  title: () => pageSEO.value.title,
  titleTemplate: getTitleTemplate,
});


if (image) {
  useSeoMeta({
    ogImage: () => image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: () => `${pageSEO.value.description ||  pageSEO.value.title || seo.title} preview`,
    twitterImage: () => image,
    twitterImageAlt: () => `${pageSEO.value.description ||  pageSEO.value.title || seo.title} preview`,
  });
}
if (isWriting && "date" in page) {
  useSeoMeta({ 
    articleModifiedTime: page.date ?? '',
    articleTag: page.tags,
    articlePublishedTime: page.date,
  })
}
</script>

<template>
  <slot />
</template>