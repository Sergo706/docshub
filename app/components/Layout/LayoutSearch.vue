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
    { label: 'Getting Started', icon: 'i-lucide-rocket', to: '/docs/getting-started' },
    { label: 'Auth H3 Client', icon: 'i-lucide-layers', to: '/docs/auth-h3client' },
    { label: 'IAM Service', icon: 'i-lucide-shield-check', to: '/docs/iam' },
    { label: 'Bot Detector', icon: 'i-lucide-shield-half', to: '/docs/bot-detection' },
    { label: 'Shield Base', icon: 'i-lucide-database-zap', to: '/docs/shield-base' },
    { label: 'Utilities', icon: 'i-lucide-wrench', to: '/docs/utils' },
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