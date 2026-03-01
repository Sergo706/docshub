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
  <UButton
    color="neutral"
    variant="ghost"
    icon="i-lucide-search"
    @click="open = true"
  >
    <template #trailing>
      <span class="hidden lg:flex items-center gap-0.5">
        <UKbd
          value="meta"
          size="sm"
        />

        <UKbd
          value="K"
          size="sm"
        />
      </span>
    </template>
  </UButton>
      
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