<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui';
import { defineOrganization, useSchemaOrg } from '@unhead/schema-org/vue';

definePageMeta({
  layout: 'default',
});

const navData = inject<Ref<NavigationCollection>>('navLinks');
const docsCategory = computed(() => navData?.value.links.find(l => l.label === 'Docs'));

const { data } = await useAsyncData('landing', async () => {
  const [landing, metadata] = await Promise.all([
    queryCollection('landing').first(),
    queryCollection('metadata').first()
  ]);
  return { landing, metadata };
});

if (!data.value?.landing) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true });
}

const page = computed(() => data.value?.landing ?? null);
const metadata = computed(() => data.value?.metadata ?? null);

const coreModules = computed(() => {
  const category = docsCategory.value;
  if (category && 'children' in category && Array.isArray(category.children)) {
    return category.children;
  }
  return [];
});

const links = ref<ButtonProps[]>([
  {
    label: 'Get started',
    to: '/docs/getting-started',
    icon: 'i-lucide-square-play'
  },
  {
    label: 'GitHub',
    to: 'https://github.com/Sergo706/docshub',
    color: 'primary',
    variant: 'outline',
    trailingIcon: 'i-simple-icons-github'
  }
]);

useSchemaOrg([
  defineOrganization({
    name: 'Riavzon',
    logo: '/favicon.svg',
    url: 'https://docs.riavzon.com',
  }),
]);

if (import.meta.server) {
  defineOgImageComponent('OgImage', {
    title: 'Riavzon Ecosystem',
    description: 'Centralized documentation for the Riavzon ecosystem',
  });
}

</script>

<template>
  <template v-if="coreModules && page">
    <SeoMetadata
      :page
      :is-writing="false"
    />
    <UPageBody>
      <GlowingBlob />
      <ContentRenderer
        :value="page"
        :data="{ links }"
      />

      <UPageSection title="Build with trusted tools">
        <UPageLogos 
          v-if="metadata?.tools?.length"
          marquee
          :items="metadata.tools"
        />
      </UPageSection>
      <UPageSection
        :title="metadata?.featuresMetaData.featuresTitle"
        :description="metadata?.featuresMetaData.featuresDescription"
      >
        <UPageGrid>
          <template #default>
            <UPageCard
              v-for="(card, index) in metadata?.featuresMetaData.features"
              :key="index"
              spotlight-color="primary"
              spotlight
              v-bind="card"
              target="_blank"
            />
          </template>
        </UPageGrid>
      </UPageSection>


      <UPageSection
        title="Explore Core Modules"
        icon="i-lucide-rocket"
        description="The Riavzon ecosystem provides a comprehensive suite of security and utility modules to help you build robust web applications."
      >
        <template #features>
          <LayoutModuleCards 
            v-for="(mod, index) in coreModules"
            :key="index"
            :badge="mod.badge"
            :description="mod.description"
            :label="mod.label"
            :cta="'Read Docs'"
            :icon="mod.icon"
            :to="mod.to"
          />
          <UPageCard
            title="Deep dive"
            description="Learn how to configure and integrate our authentication and security suites into your applications."
            icon="i-lucide-rocket"
            to="/docs/getting-started"
            spotlight
            spotlight-color="primary"
          >
            <template #footer>
              <UButton 
                class="ml-auto"
                label="Start reading docs"
                to="/docs/getting-started"
                icon="i-lucide-square-play"
              />
            </template>
          </UPageCard>
        </template>
      </UPageSection>
    </UPageBody>
  </template>
</template>
