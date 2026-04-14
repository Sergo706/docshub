<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { defineWebPage, useSchemaOrg } from '@unhead/schema-org/vue';

definePageMeta({
  layout: 'default'
});

const { data } = await useAsyncData("blog_data", async () => {
  const [landing, posts] = await Promise.all([
    queryCollection('blog_landing').first(),
    queryCollection('blog').order('date', 'DESC').all()
  ]);
  return { landing, posts };
});

const page = computed(() => data.value?.landing ?? null);

const posts = computed(() => {
  const raw = data.value?.posts ?? [];
  const featured = raw.find(p => p.featured) ?? null;
  const rest = raw.filter(p => !p.featured);
  return { featured, regular: rest };
});

useSchemaOrg([
  defineWebPage({
    '@type': 'CollectionPage',
    name: 'Riavzon Blog',
    description: 'Latest articles from the Riavzon ecosystem',
  }),
]);

if (import.meta.server) {
  defineOgImage('Image', {
    title: page.value?.title,
    description: page.value?.description,
  });
}
</script>

<template>
  <SeoMetadata
    v-if="page"
    :page="page"
    :is-writing="false"
  />
  <UPageBody v-if="page">
    <UPageHeader
      :title="page.title"
      :description="page.description"
    />
    
    <UBlogPosts v-if="posts.regular || posts.featured">
      <UBlogPost
        v-if="posts.featured"
        class="col-span-full"
        :to="posts.featured.path"
        :title="posts.featured.title"
        :description="posts.featured.description"
        :date="posts.featured.date"
        :image="posts.featured.image"
        :badge="{ label: posts.featured.tags?.[0], color: 'primary' }"
        variant="subtle"
        orientation="horizontal"
        :authors="[{ name: posts.featured.author, description: posts.featured.authorGithubUserName, avatar: { src: posts.featured.authorImg, loading: 'lazy' }, to: posts.featured.authorGithub, target: '_blank' }]"
        :ui="{ header: 'aspect-auto lg:h-full', image: 'object-cover w-full h-full' }"
      />
      <UBlogPost
        v-for="(post, index) in posts.regular"
        :key="index"
        :to="post.path"
        :title="post.title"
        :description="post.description"
        :date="post.date"
        :image="post.image"
        :badge="{ label: post.tags?.[0], color: 'primary' }"
        variant="outline"
        :authors="[{ name: post.author, description: post.authorGithubUserName, avatar: { src: post.authorImg, loading: 'lazy' }, to: post.authorGithub, target: '_blank' }]"
      />
    </UBlogPosts>
  </UPageBody>
</template>
