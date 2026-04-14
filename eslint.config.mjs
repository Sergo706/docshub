import { defineStrictVueConfig } from '@riavzon/utils/eslint/strict/vue';

export default defineStrictVueConfig({
    rootDir: import.meta.dirname,
    extraIgnores: ['/content/**', '*.config.*']
})