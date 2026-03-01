<script setup lang="ts">
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

  </UApp>
</template>