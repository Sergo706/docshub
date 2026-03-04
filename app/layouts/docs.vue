<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import type { ContentNavigationItem, DocsCollectionItem } from '@nuxt/content';
import type { PageLink } from '@nuxt/ui';
import { parsePath } from 'ufo';

const route = useRoute();

const baseNavPath = computed(() => {
  const parts = parsePath(route.path).pathname.split('/');
  return parts.slice(0, 3).join('/');
});

const sidebarDocsNavigation = inject<Ref<ContentNavigationItem[]>>('sidebar_docs_navigation');
const navData = inject<Ref<NavigationCollection>>('navLinks');

const docsCategory = computed(() => {
  return navData?.value.links.find(l => l.label === 'Docs');
});

const pathLink = computed(() => {
  const category = docsCategory.value;
  if (category && 'children' in category && Array.isArray(category.children)) {
    const children = category.children;
    const activeNavItem = children.find(child => child.to === baseNavPath.value);
    
    return {
      navPath: baseNavPath.value,
      gitHubLink: activeNavItem?.github ?? 'https://github.com/Sergo706/docshub',
      headLine: activeNavItem?.label ?? 'Overview',
    };
  }

  return {
    navPath: baseNavPath.value,
    gitHubLink: 'https://github.com/Sergo706/docshub',
    headLine: 'Overview',
  };
});

const { data: pageData } = await useAsyncData<DocsCollectionItem | null>(
  `${route.path}_page`,
  () => queryCollection('docs').path(route.path).first(),
  { watch: [() => route.path] }
);

const { data: surroundData } = await useAsyncData<ContentNavigationItem[]>(
  `${route.path}_surround`,
  () => queryCollectionItemSurroundings('docs', route.path)
    .where('path', 'LIKE', `%${pathLink.value.navPath}%`),
  { watch: [() => route.path] }
);

const navigation = computed(() => {
  const navArray = sidebarDocsNavigation?.value;
  if (!navArray || navArray.length === 0) return [];

  return navArray[0]?.children ?? navArray;
});

const page = computed(() => pageData.value ?? null);
const surround = computed(() => {
  const raw = surroundData.value;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
});

const links = computed<PageLink[]>(() => [{
  icon: 'i-lucide-file-pen',
  label: 'Edit this page',
  to: `https://github.com/Sergo706/docshub/edit/main/content/docs/${page.value?.stem ?? ''}.md`,
  target: '_blank'
}, {
  icon: 'i-lucide-star',
  label: 'Star on GitHub',
  to: pathLink.value.gitHubLink,
  target: '_blank'
}]);

</script>

<template>
  <UContainer class="max-w-[95rem]">
    <UPage
      v-if="page"
      as="article"
      class="[--ui-header-height:64px] lg:[--ui-header-height:112px]"
    >
      <template #left>
        <UPageAside :key="route.path">
          <UContentNavigation 
            variant="link"
            highlight
            :navigation="navigation" 
            :default-open="true"
          />
        </UPageAside>
      </template>
      
      <UPageHeader
        :title="page.title"
        :description="page.description"
        :headline="pathLink.headLine"
      >
        <template #links>
          <LayoutActionsDropdown 
            :content="page?.rawbody || page?.description || ''"
            :md-url="`https://raw.githubusercontent.com/Sergo706/docshub/main/content/docs/${page?.stem ?? ''}.md`"
          />
        </template>
      </UPageHeader>

      <UPageBody as="section">
        <slot />

        <USeparator v-if="surround.length > 0" />

        <UContentSurround :surround="surround" />
      </UPageBody>

      <template #right>
        <UContentToc
          highlight
          :links="page.body?.toc?.links"
        > 
          <template #bottom>
            <USeparator type="dashed" />

            <UPageLinks
              title="Github"
              :links="links"
            />
          </template>
        </UContentToc>
      </template>
    </UPage>
  </UContainer>
</template>