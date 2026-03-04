import { z } from 'zod';

export const MetaDataSchema = z.object({
    featuresMetaData: z.object({
        featuresTitle: z.string(),
        featuresDescription: z.string(),
        features: z.array(z.object({
            title: z.string(),
            description: z.string(),
            icon: z.string(),
            to: z.string()
        }))
    }),
    tools: z.array(z.string())
});
export type MetaDataType = z.infer<typeof MetaDataSchema>