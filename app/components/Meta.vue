<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import type { PageCollectionItemBase } from "@nuxt/content";
import { joinURL } from 'ufo';

interface SeoConfig {
  title: string;
  description: string;
  url: string;
}

interface ProfileConfig {
  name: string;
}

const { page, isWriting } = defineProps<{
  page: PageCollectionItemBase
  isWriting: boolean
}>();

const route = useRoute();
const appConfig = useAppConfig();
const seo = appConfig.seo as SeoConfig;
const profile = appConfig.profile as ProfileConfig;


const canonicalUrl = joinURL(seo.url, route.path);
const ogImageUrl = joinURL(seo.url, '/projects/portfolio.png');

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
  ogSiteName: seo.title,
  ogTitle: () => pageSEO.value.title,
  ogDescription: () => pageSEO.value.description,
  ogType: isWriting ? 'article' : 'website',
  ogUrl: canonicalUrl,
  ogLocale: 'en_US',
  ogImage: ogImageUrl,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: `${seo.title} preview`,
  author: profile.name,
  title: () => pageSEO.value.title,
  description: () => pageSEO.value.description,
  twitterTitle: () => pageSEO.value.title,
  twitterDescription: () => pageSEO.value.description,
  twitterCard: 'summary_large_image',
  twitterImage: ogImageUrl,
  twitterImageAlt: `${seo.title} preview`,
  ...(isWriting && {
    articleAuthor: [profile.name],
  }),
});

useHead({
  title: () => pageSEO.value.title,
  titleTemplate: getTitleTemplate,
  link: [
    { rel: 'canonical', href: canonicalUrl },
  ],
});

defineOgImage({ url: ogImageUrl, width: 1200, height: 630, alt: `${seo.title} preview` });
</script>

<template>
  <slot />
</template>