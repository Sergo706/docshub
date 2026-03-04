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

</script>

<template>
  <div v-if="page">
    <Meta :page="page" />
    <ContentRenderer
      v-if="page"
      :value="page"
    />
  </div>
</template>
