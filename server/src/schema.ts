import { z } from 'zod';

// Pura schemas
export const puraSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string(),
  description: z.string(),
  target_amount: z.number(),
  current_amount: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Pura = z.infer<typeof puraSchema>;

export const createPuraInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().min(1, "Description is required"),
  target_amount: z.number().positive("Target amount must be positive")
});

export type CreatePuraInput = z.infer<typeof createPuraInputSchema>;

export const updatePuraInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  target_amount: z.number().positive().optional()
});

export type UpdatePuraInput = z.infer<typeof updatePuraInputSchema>;

// Donation schemas
export const donationSchema = z.object({
  id: z.number(),
  pura_id: z.number(),
  donor_name: z.string(),
  amount: z.number(),
  message: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Donation = z.infer<typeof donationSchema>;

export const createDonationInputSchema = z.object({
  pura_id: z.number(),
  donor_name: z.string().min(1, "Donor name is required"),
  amount: z.number().positive("Amount must be positive"),
  message: z.string().nullable().optional()
});

export type CreateDonationInput = z.infer<typeof createDonationInputSchema>;

// Educational content schemas
export const contentCategoryEnum = z.enum([
  'history',
  'culture',
  'traditions',
  'festivals',
  'architecture',
  'ceremonies',
  'philosophy',
  'general'
]);

export type ContentCategory = z.infer<typeof contentCategoryEnum>;

export const educationalContentSchema = z.object({
  id: z.number(),
  title: z.string(),
  category: contentCategoryEnum,
  content: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type EducationalContent = z.infer<typeof educationalContentSchema>;

export const createEducationalContentInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: contentCategoryEnum,
  content: z.string().min(1, "Content is required")
});

export type CreateEducationalContentInput = z.infer<typeof createEducationalContentInputSchema>;

export const updateEducationalContentInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  category: contentCategoryEnum.optional(),
  content: z.string().min(1).optional()
});

export type UpdateEducationalContentInput = z.infer<typeof updateEducationalContentInputSchema>;

// Smart search schemas
export const smartSearchInputSchema = z.object({
  query: z.string().min(1, "Query is required"),
  category: contentCategoryEnum.optional()
});

export type SmartSearchInput = z.infer<typeof smartSearchInputSchema>;

export const smartSearchResultSchema = z.object({
  content: educationalContentSchema,
  relevanceScore: z.number().min(0).max(1),
  excerpt: z.string()
});

export type SmartSearchResult = z.infer<typeof smartSearchResultSchema>;

export const smartSearchResponseSchema = z.object({
  query: z.string(),
  results: z.array(smartSearchResultSchema),
  total: z.number()
});

export type SmartSearchResponse = z.infer<typeof smartSearchResponseSchema>;

// Pura with donations schema (for detailed view)
export const puraWithDonationsSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string(),
  description: z.string(),
  target_amount: z.number(),
  current_amount: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  donations: z.array(donationSchema)
});

export type PuraWithDonations = z.infer<typeof puraWithDonationsSchema>;