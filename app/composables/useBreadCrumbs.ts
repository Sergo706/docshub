import type { ContentNavigationItem } from "@nuxt/content";
import { findPageBreadcrumb } from "@nuxt/content/utils";
import { mapContentNavigation } from '@nuxt/ui/utils/content';


export function useBreadCrumbs(routePath: string, truncate: boolean) {
    const truncateText = (text: string, max: number): string =>
        text.length > max ? `${text.slice(0, max)}...` : text;

    const mapBread = (nav: ContentNavigationItem[]): Ref<{label: string, to?: string}[]> => {
        if (!nav.length) return ref([]);

        const crumbs = findPageBreadcrumb(nav, routePath, { indexAsChild: true, current: true }) as ContentNavigationItem[];

        let mapped = mapContentNavigation(crumbs, { deep: 0 }).map(item => ({
            ...item,
            label: item.label ?? ''
        }));
        
        if (truncate) {
            mapped = mapped.map(item => ({ ...item, label: truncateText(item.label, 25) }));
        }
        
        const isBlog = computed(() => routePath.startsWith('/blog'));

        if (!isBlog.value) {
            mapped = mapped.map(item => item.label === 'Docs' ? { ...item, to: '/docs/getting-started' } : item)
             .filter((item, index, self) => self.findIndex(i => i.label === item.label) === index);
        }
        
        return ref(mapped);
    };

    return mapBread;
}
