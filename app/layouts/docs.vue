<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import type { ContentNavigationItem, DocsCollectionItem } from '@nuxt/content';
import type { PageLink } from '@nuxt/ui';
import { parsePath } from 'ufo';

const route = useRoute();
const path = computed(() => parsePath(route.path).pathname);

const pathLink = computed(() => {
  if (path.value.includes('/docs/auth-h3client')) {
      return {
        navPath: '/docs/auth-h3client',
        gitHubLink: 'https://github.com/Sergo706/auth-h3client',
        headLine: 'Auth H3 Client'
      }; 
  } else if (path.value.includes('/docs/iam')) {
      return {
        navPath: '/docs/iam',
        gitHubLink: 'https://github.com/Sergo706/auth',
        headLine: 'IAM'
      };
  } else if(path.value.includes('/docs/bot-detection')) {
    return {
        navPath: '/docs/bot-detection',
        gitHubLink: 'https://github.com/Sergo706/bot-detector',
        headLine: 'Bot Detection'
    };
  } else if (path.value.includes('/docs/utils')) {
    return {
        navPath: '/docs/utils',
        gitHubLink: 'https://github.com/Sergo706/utils',
        headLine: 'Utils'
    };
  } else {
    return {
        navPath: '/docs/getting-started',
        gitHubLink: 'https://github.com/Sergo706/docshub',
        headLine: 'Overview'
    };
  }
});

const { data } = await useAsyncData<[ContentNavigationItem[], DocsCollectionItem | null, ContentNavigationItem[]]>(`${route.path}_layout`, async () => {
 const data = await Promise.all([
    queryCollectionNavigation('docs').where('path', 'LIKE', `%${pathLink.value.navPath}%`),
    queryCollection('docs').path(route.path).first(),
    queryCollectionItemSurroundings('docs', route.path)
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

        <USeparator />

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