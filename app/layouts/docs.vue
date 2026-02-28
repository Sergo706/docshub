<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content';

const navigation = inject<Ref<ContentNavigationItem[] | null>>('navigation');
const colorMode = useColorMode();

const isDark = computed({
  get: (): boolean => colorMode.value === 'dark',
  set: (value: boolean): void => {
    colorMode.preference = value ? 'dark' : 'light';
  }
});
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="glass sticky top-4 z-50 mx-auto mt-4 max-w-7xl !rounded-full px-2">
      <div class="flex h-14 items-center justify-between px-4">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 text-lg font-bold"
        >
          <UIcon
            name="lucide:book-open"
            class="size-5 text-accent-500 dark:text-accent-400"
          />
          <span class="text-riavzon-500 dark:bg-gradient-to-b dark:from-white/50 dark:to-white dark:bg-clip-text dark:text-transparent">
            DocsHub
          </span>
        </NuxtLink>

        <div class="flex items-center gap-1">
          <UButton
            :icon="isDark ? 'lucide:sun' : 'lucide:moon'"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="isDark = !isDark"
          />
          <UButton
            icon="lucide:github"
            to="https://github.com/Sergo706/docshub"
            target="_blank"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </div>
      </div>
    </header>

    <!-- Main layout -->
    <div class="mx-auto flex max-w-7xl">
      <!-- Sidebar -->
      <aside class="sticky top-24 hidden h-[calc(100vh-7rem)] w-64 shrink-0 overflow-y-auto p-6 lg:block">
        <nav
          v-if="navigation"
          class="space-y-1"
        >
          <template
            v-for="item in navigation"
            :key="item.path"
          >
            <!-- Top-level link -->
            <NuxtLink
              v-if="!item.children?.length"
              :to="item.path"
              active-class="text-accent-600 dark:text-accent-400 font-semibold"
              class="flex items-center rounded-lg px-3 py-2 text-sm text-riavzon-400 dark:text-white/50 transition-colors hover:text-riavzon-500 dark:hover:text-white"
            >
              {{ item.title }}
            </NuxtLink>

            <!-- Section with children -->
            <div
              v-else
              class="mt-6 first:mt-0"
            >
              <p class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-riavzon-300 dark:text-white/30">
                {{ item.title }}
              </p>
              <NuxtLink
                v-for="child in item.children"
                :key="child.path"
                :to="child.path"
                active-class="text-accent-600 dark:text-accent-400 font-semibold"
                class="flex items-center rounded-lg px-3 py-2 text-sm text-riavzon-400 dark:text-white/50 transition-colors hover:text-riavzon-500 dark:hover:text-white"
              >
                {{ child.title }}
              </NuxtLink>
            </div>
          </template>
        </nav>
      </aside>

      <!-- Content -->
      <main class="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-12">
        <slot />
      </main>
    </div>

    <!-- Footer -->
    <footer class="border-t border-riavzon-200 dark:border-white/5 py-8">
      <div class="mx-auto max-w-7xl px-4 text-center text-sm text-riavzon-300 dark:text-white/30">
        © {{ new Date().getFullYear() }} Riavzon — Ecosystem Documentation
      </div>
    </footer>
  </div>
</template>
