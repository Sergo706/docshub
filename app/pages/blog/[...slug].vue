<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
const route = useRoute();
const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('blog').path(route.path).first();
});

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true });
}

definePageMeta({
  layout: 'blog'
});

useSeoMeta({
  title: page.value.title,
  description: page.value.description
});
</script>

<template>
  <UContainer v-if="page">
    <UPage>
      <UPageHeader :title="page.title" :description="page.description" />
      <UPageBody prose>
        <ContentRenderer :value="page" />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
