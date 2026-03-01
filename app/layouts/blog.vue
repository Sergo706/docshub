<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="layout-blog">
    <UContainer>
      <div class="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8 py-8">
        <main>
          <slot />
        </main>
        <aside class="hidden md:block">
          <!-- TODO: Blog categories/sidebar -->
        </aside>
      </div>
    </UContainer>
  </div>
</template>
