import { defineStrictVueConfig } from '@sergo/utils/eslint/strict/vue';

export default defineStrictVueConfig({
    rootDir: import.meta.dirname,
    extraIgnores: ['/content/**', '*.config.*']
})