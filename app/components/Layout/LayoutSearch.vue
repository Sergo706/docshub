<script setup lang="ts">
const { open } = useContentSearch();
const searchTerm = ref('');

const { data: navigation } = await useAsyncData('navigation', () => {
  return queryCollectionNavigation('docs');
});

const { data: files, status } = useLazyAsyncData('search', () => {
  return queryCollectionSearchSections('docs');
}, {
  server: false
});

const groups = [{
  id: 'links',
  label: 'Explore',
  slot: 'links' as const,
  items: [
  { label: 'Docs', icon: 'i-lucide-book', to: '/docs/getting-started' }, 
  { label: 'Auth (H3 Client)', icon: 'i-lucide-lock', to: '/docs/auth-h3client/1.overview.md' }, 
  { label: 'IAM Service', icon: 'i-lucide-shield-check', to: '/docs/iam/1.overview.md' }, 
  { label: 'Bot Detection', icon: 'i-lucide-bot', to: '/docs/bot-detection/1.overview.md' }, 
  { label: 'Utilities', icon: 'i-lucide-wrench', to: '/docs/utils/1.overview.md' }, 
  ]
}];
</script>

<template>
  <UContentSearchButton
    :collapsed="true"
    variant="ghost"
    icon="i-lucide-search"
    @click="open = true"
  />
      
  <ClientOnly>
    <LazyUContentSearch
      v-model:search-term="searchTerm"
      :files="files"
      shortcut="meta_k"
      :navigation="navigation"
      :fuse="{ resultLimit: 42 }"
      :loading="status === 'pending'"
      :groups
      placeholder="Search documentation..."
    />
  </ClientOnly>
</template>