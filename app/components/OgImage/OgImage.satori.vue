<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  title?: string
  // eslint-disable-next-line vue/require-default-prop
  description?: string
  colorMode?: 'dark' | 'light'
  siteName?: string
}>(), {
  colorMode: 'dark',
  title: 'Riavzon Ecosystem',
  siteName: 'docs.riavzon.com',
});

const bg = computed((): string =>
  props.colorMode === 'dark' ? '#0A0908' : '#FAF9F8'
);

const textPrimary = computed((): string =>
  props.colorMode === 'dark' ? '#F4F2F0' : '#12100E'
);

const textSecondary = computed((): string =>
  props.colorMode === 'dark' ? '#A19A93' : '#504A45'
);

const accent = '#F59E0B';
const accentDim = 'rgba(245, 158, 11, 0.12)';
const accentGlow = 'rgba(245, 158, 11, 0.06)';
</script>

<template>
  <div
    :style="{
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '60px 70px',
      backgroundColor: bg,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
    }"
  >
    <div
      :style="{
        position: 'absolute',
        top: '0',
        right: '0',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentDim}, transparent 70%)`,
        transform: 'translate(30%, -30%)',
      }"
    />
    <div
      :style="{
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentGlow}, transparent 70%)`,
        transform: 'translate(-20%, 20%)',
      }"
    />

    <div
      :style="{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }"
    />

    <!-- Content -->
    <div
      :style="{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',

        flex: '1',
        justifyContent: 'center',
      }"
    >
      <div
        :style="{
          fontSize: title.length > 40 ? '52px' : '64px',
          fontWeight: '700',
          color: textPrimary,
          lineHeight: '1.15',
          letterSpacing: '-0.02em',
          maxWidth: '1000px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: '3',
          WebkitBoxOrient: 'vertical',
        }"
      >
        {{ title }}
      </div>

      <div
        v-if="description"
        :style="{
          fontSize: '28px',
          fontWeight: '400',
          color: textSecondary,
          lineHeight: '1.5',
          maxWidth: '850px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: '2',
          WebkitBoxOrient: 'vertical',
        }"
      >
        {{ description }}
      </div>
    </div>

    <div
      :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',

      }"
    >
      <div
        :style="{
          fontSize: '22px',
          fontWeight: '500',
          color: accent,
          letterSpacing: '0.02em',
        }"
      >
        {{ siteName }}
      </div>

      <div
        :style="{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }"
      >
        <div
          :style="{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: accent,
            opacity: '0.4',
          }"
        />
        <div
          :style="{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: accent,
            opacity: '0.6',
          }"
        />
        <div
          :style="{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: accent,
            opacity: '1',
          }"
        />
      </div>
    </div>
  </div>
</template>