<script setup lang="ts">
defineProps<{
  badge?: string,
  label: string,
  description?: string,
  icon?: string,
  cta: string,
  to?: string
}>();

</script>
<template>
  <UCard
    class="glass relative group hover:border-accent-400 dark:hover:border-accent-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent-500/10 cursor-pointer overflow-hidden flex flex-col h-full"
    :ui="{ 
      root: 'flex-1 flex flex-col',
      body: 'flex-1 flex flex-col p-6 sm:p-8'
    }"
  >
    <div
      class="absolute top-4 right-4"
    >
      <UBadge
        size="sm"
        color="neutral"
        variant="soft"
        class="text-xs transition-colors group-hover:bg-accent-100 dark:group-hover:bg-accent-900 group-hover:text-accent-700 dark:group-hover:text-accent-300"
      >
        {{ badge }}
      </UBadge>
    </div>
            
    <div class="rounded-xl flex items-center justify-center w-12 h-12 bg-accent-100 dark:bg-accent-950/50 mb-6 group-hover:bg-accent-200 dark:group-hover:bg-accent-900 transition-colors shadow-inner shrink-0">
      <UIcon
        :name="icon"
        class="w-6 h-6 text-accent-600 dark:text-accent-400 group-hover:scale-110 transition-transform duration-300"
      />
    </div>
            
    <h3 class="font-semibold text-xl text-riavzon-900 dark:text-white mb-3 tracking-tight">
      {{ label }}
    </h3>
            
    <p class="text-sm text-riavzon-600 dark:text-riavzon-400 mb-8 leading-relaxed flex-1">
      {{ description }}
    </p>
            
    <div class="mt-auto shrink-0 w-full">
      <USeparator class="mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <UButton
        variant="link"
        color="primary"
        :to="to"
        class="p-0 font-semibold tracking-wide w-full justify-between"
        icon="i-lucide-arrow-right"
        trailing
      >
        {{ cta }}
      </UButton>
    </div>
  </UCard>
</template>