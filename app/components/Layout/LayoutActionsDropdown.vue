<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import { useCopy } from '~/composables/useCopy';

const props = defineProps<{
    content: string,
    mdUrl: string,
}>();

const copyText = useCopy();
const currentUrl = ref('');

onMounted(() => {
  currentUrl.value = `https://docs.riavzon.com${window.location.pathname}`;
});


const items = computed<DropdownMenuItem[]>(() => [
  {
    label: 'Copy Page Link',
    icon: 'i-lucide-link',
    onSelect: () => { copyText(currentUrl.value); }
  },
  {
    label: 'View as Markdown',
    icon: 'i-lucide-file-text',
    to: props.mdUrl,
    target: '_blank'
  },
  {
    label: 'Open in ChatGPT',
    icon: 'i-simple-icons-openai',
    to: `https://chatgpt.com/?prompt=${encodeURIComponent('Read ' + currentUrl.value + ' so I can ask questions about it.')}`,
    target: '_blank'
  },
  {
    label: 'Open in Claude',
    icon: 'i-simple-icons-anthropic',
    to: `https://claude.ai/new?q=${encodeURIComponent('Read ' + currentUrl.value + ' so I can ask questions about it.')}`,
    target: '_blank'
  }
]);

</script>

<template>
  <UFieldGroup size="sm">
    <UButton
      color="neutral"
      variant="subtle"
      label="Copy Page"
      icon="lucide:copy"
      @click="() => copyText(props.content)"
    />

    <UDropdownMenu
      :items="items"
      size="sm"
    >
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-chevron-down"
        aria-label="More actions"
      />
    </UDropdownMenu>
  </UFieldGroup>
</template>