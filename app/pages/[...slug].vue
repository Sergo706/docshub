<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
definePageMeta({
  layout: 'docs',
})

const route = useRoute()

const { data: page } = await useAsyncData('page-' + route.path, () => {
  return queryCollection('content').path(route.path).first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useHead({
  title: page.value.title,
})
</script>

<template>
  <article class="prose prose-lg dark:prose-invert max-w-none">
    <ContentRenderer
      v-if="page"
      :value="page"
    />
  </article>
</template>
