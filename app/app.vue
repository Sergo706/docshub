<script setup lang="ts">
import LayoutFooter from './components/Layout/LayoutFooter.vue';
import LayoutHeader from './components/Layout/LayoutHeader.vue';

</script>

<template>
  <UApp>
    <LayoutHeader />

    <UMain>
      <NuxtLayout>
        <NuxtRouteAnnouncer />
        <NuxtPage />
      </NuxtLayout>
    </UMain>
    
    <USeparator
      :avatar="{
        src: '/favicon.svg',
        alt: 'Logo',
        loading: 'lazy',
      }"
      color="neutral"
      decorative
    />

    <LayoutFooter />
  </UApp>
</template>