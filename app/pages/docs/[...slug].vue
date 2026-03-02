<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
const route = useRoute();

const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('docs').path(route.path).first();
});

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

definePageMeta({
  layout: 'docs'
});

</script>

<template>
  <template v-if="page">
    <Meta :page />
    <ContentRenderer :value="page" />
  </template>
</template>
