import { z } from 'zod';

export const NavigationItemSchema = z.object({
  label: z.string(),
  icon: z.string().optional(),
  to: z.string(),
  description: z.string().optional(),
  github: z.string().optional(),
  badge: z.string().optional()
});

const BaseNavigationMenuSchema = NavigationItemSchema.extend({
  nested: z.literal(false),
});

const NestedNavigationMenuSchema = NavigationItemSchema.extend({
  nested: z.literal(true),
  children: z.array(NavigationItemSchema)
});

export const NavigationMenuSchema = z.discriminatedUnion("nested", [
  BaseNavigationMenuSchema,
  NestedNavigationMenuSchema
]);

export const NavigationCollectionSchema = z.object({
  links: z.array(NavigationMenuSchema)
});

export type NavigationMenu = z.infer<typeof NavigationMenuSchema>
export type NavigationItem = z.infer<typeof NavigationItemSchema>
export type NavigationCollection = z.infer<typeof NavigationCollectionSchema>;