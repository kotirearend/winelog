import { z } from 'zod';

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(1, 'Name is required'),
  defaultCurrency: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .optional()
    .default('GBP'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Location schemas
export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
});

// Bottle schemas
export const bottleCreateSchema = z.object({
  name: z.string().min(1, 'Bottle name is required'),
  locationId: z.string().uuid('Invalid location ID'),
  vintage: z.number().int().optional(),
  purchaseDate: z.string().date().optional(),
  purchaseSourceType: z
    .enum(['RESTAURANT', 'SHOP', 'OTHER'])
    .optional(),
  purchaseSourceName: z.string().optional(),
  priceAmount: z
    .number()
    .positive('Price must be positive')
    .optional(),
  priceCurrency: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .optional(),
  subLocationText: z.string().optional(),
  quantity: z
    .number()
    .int()
    .min(1, 'Quantity must be at least 1')
    .default(1),
  photoUrl: z.string().url('Invalid URL').optional(),
});

export const bottleUpdateSchema = bottleCreateSchema.partial().extend({
  producer: z.string().optional(),
  notesShort: z.string().max(500, 'Short notes must be 500 characters or less').optional(),
  notesLong: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Tasting session schemas
export const tastingCreateSchema = z.object({
  name: z.string().min(1, 'Tasting session name is required'),
  tastedAt: z.string().datetime().optional(),
  venue: z.string().optional(),
  participants: z.string().optional(),
  notes: z.string().optional(),
});

export const tastingUpdateSchema = tastingCreateSchema.partial();

// Tasting entry schemas
export const tastingEntryCreateSchema = z
  .object({
    bottleId: z.string().uuid('Invalid bottle ID').optional(),
    adHocName: z.string().optional(),
    adHocPhotoUrl: z.string().url('Invalid URL').optional(),
    saveToCellar: z.boolean().optional().default(false),
  })
  .refine(
    (data) => data.bottleId || data.adHocName,
    {
      message: 'Either bottleId or adHocName must be provided',
      path: ['bottleId'],
    }
  );

export const tastingEntryScoreSchema = z.object({
  appearanceScore: z
    .number()
    .int()
    .min(0, 'Score must be between 0 and 20')
    .max(20, 'Score must be between 0 and 20')
    .optional(),
  noseScore: z
    .number()
    .int()
    .min(0, 'Score must be between 0 and 20')
    .max(20, 'Score must be between 0 and 20')
    .optional(),
  palateScore: z
    .number()
    .int()
    .min(0, 'Score must be between 0 and 20')
    .max(20, 'Score must be between 0 and 20')
    .optional(),
  finishScore: z
    .number()
    .int()
    .min(0, 'Score must be between 0 and 20')
    .max(20, 'Score must be between 0 and 20')
    .optional(),
  balanceScore: z
    .number()
    .int()
    .min(0, 'Score must be between 0 and 20')
    .max(20, 'Score must be between 0 and 20')
    .optional(),
  notesShort: z.string().max(500, 'Short notes must be 500 characters or less').optional(),
  notesLong: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Save to cellar schema
export const saveToCellarSchema = z.object({
  locationId: z.string().uuid('Invalid location ID'),
  subLocationText: z.string().optional(),
  quantity: z
    .number()
    .int()
    .min(1, 'Quantity must be at least 1')
    .default(1),
});

// Type exports for use in application
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type BottleCreateInput = z.infer<typeof bottleCreateSchema>;
export type BottleUpdateInput = z.infer<typeof bottleUpdateSchema>;
export type TastingCreateInput = z.infer<typeof tastingCreateSchema>;
export type TastingUpdateInput = z.infer<typeof tastingUpdateSchema>;
export type TastingEntryCreateInput = z.infer<typeof tastingEntryCreateSchema>;
export type TastingEntryScoreInput = z.infer<typeof tastingEntryScoreSchema>;
export type SaveToCellarInput = z.infer<typeof saveToCellarSchema>;
