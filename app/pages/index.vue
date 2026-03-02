<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">

definePageMeta({
  layout: 'default',
});

const route = useRoute();

const { data: page } = await useAsyncData('page' + route.path, () => {
  return queryCollection('landing').first();
});

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

</script>

<template>
  <article class="prose prose-lg dark:prose-invert max-w-none">
    <Meta :page />
    <ContentRenderer
      v-if="page"
      :value="page"
    />
  </article>
</template>
