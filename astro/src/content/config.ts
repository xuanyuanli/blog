import { defineCollection, z } from 'astro:content';

/** 思考碎片内容集合 */
const thoughts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    path: z.string().optional(),
  }),
});

export const collections = { thoughts };
