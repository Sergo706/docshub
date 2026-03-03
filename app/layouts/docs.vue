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

const navData = inject<NavigationCollection>('navLinks');
const docsCategory = navData?.links.find(l => l.label === 'Docs');

if (!docsCategory) {
  throw createError({
    status: 500,
    message: 'Server error',
    data: 'docsCategory is undefined'
  });
}

const pathLink = computed(() => {
  if ('children' in docsCategory && Array.isArray(docsCategory.children)) {
    const children = docsCategory.children;
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

const { data } = await useAsyncData<[ContentNavigationItem[], DocsCollectionItem | null, ContentNavigationItem[]]>(`${route.path}_layout`, async () => {
 const data = await Promise.all([
    queryCollectionNavigation('docs').where('path', 'LIKE', `%${pathLink.value.navPath}%`),
    queryCollection('docs').path(route.path).first(),
    queryCollectionItemSurroundings('docs', route.path).where('path', 'LIKE', `%${pathLink.value.navPath}%`)
  ]);
  return data;
}, { watch: [() => route.path] });

const navigation = computed(() => {
  const navArray = data.value?.[0];
  if (!navArray || navArray.length === 0) return [];
  

  return navArray[0]?.children ?? navArray;
});
const page = computed(() => data.value?.[1] ?? null);
const surround = computed(() => data.value?.[2] ?? []);

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
    >
      <template #left>
        <UPageAside class="!top-[calc(var(--ui-header-height)+30px)] !h-[calc(100vh-(var(--ui-header-height)+30px))]">
          <UContentNavigation 
            variant="link"
            highlight
            :navigation="navigation" 
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
          class="!top-[calc(var(--ui-header-height)+30px)] !h-[calc(100vh-(var(--ui-header-height)+30px))]"
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