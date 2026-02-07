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
  name: z.string().min(1, 'Wine name is required'),
  producer: z.string().optional(),
  vintage: z.number().int().optional(),
  grapes: z.array(z.string()).optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  locationId: z.string().uuid('Invalid location ID').optional(),
  purchaseDate: z.string().optional(),
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
  photoUrl: z.string().optional(),
});

export const bottleUpdateSchema = bottleCreateSchema.partial().extend({
  producer: z.string().optional(),
  status: z.enum(['in_cellar', 'consumed', 'archived']).optional(),
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

export const tastingUpdateSchema = tastingCreateSchema.partial().extend({
  summary: z.string().optional(),
});

// Tasting entry schemas
export const tastingEntryCreateSchema = z
  .object({
    bottleId: z.string().uuid('Invalid bottle ID').optional(),
    adHocName: z.string().optional(),
    adHocPhotoUrl: z.string().optional(),
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
  // Overall quality score (0-100)
  totalScore: z.number().int().min(0).max(100).optional(),
  // Structured tasting notes stored as JSON (wine WSET + beer BJCP fields)
  tastingNotes: z.object({
    // === WINE (WSET SAT) ===
    // Appearance
    clarity: z.string().optional(),
    intensityAppearance: z.string().optional(),
    colour: z.string().optional(),
    otherAppearance: z.string().optional(),
    // Nose
    condition: z.string().optional(),
    intensityNose: z.string().optional(),
    aromaCharacteristics: z.string().optional(),
    development: z.string().optional(),
    // Palate
    sweetness: z.string().optional(),
    acidity: z.string().optional(),
    tannin: z.string().optional(),
    alcohol: z.string().optional(),
    body: z.string().optional(),
    flavourIntensity: z.string().optional(),
    flavourCharacteristics: z.string().optional(),
    finish: z.string().optional(),
    // Conclusions
    qualityLevel: z.string().optional(),
    readiness: z.string().optional(),
    // === BEER (BJCP-inspired) ===
    // Appearance
    beerColour: z.string().optional(),
    beerClarity: z.string().optional(),
    headRetention: z.string().optional(),
    headColour: z.string().optional(),
    // Aroma
    maltAroma: z.string().optional(),
    hopAroma: z.string().optional(),
    fermentationAroma: z.string().optional(),
    otherAroma: z.string().optional(),
    // Flavour
    maltFlavour: z.string().optional(),
    hopFlavour: z.string().optional(),
    bitterness: z.string().optional(),
    fermentationFlavour: z.string().optional(),
    balance: z.string().optional(),
    finishAftertaste: z.string().optional(),
    // Mouthfeel
    beerBody: z.string().optional(),
    carbonation: z.string().optional(),
    warmth: z.string().optional(),
    creaminess: z.string().optional(),
    // Overall
    overallImpression: z.string().optional(),
    // === CASUAL MODE ===
    casualLooks: z.string().optional(),
    casualSmell: z.string().optional(),
    casualTaste: z.string().optional(),
    casualDrinkability: z.string().optional(),
    casualValue: z.string().optional(),
    casualBuyAgain: z.string().optional(),
    casualVibes: z.string().optional(),
  }).optional(),
  // Free text notes
  notesShort: z.string().max(500, 'Short notes must be 500 characters or less').optional(),
  notesLong: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // Legacy fields (kept for backward compat)
  appearanceScore: z.number().int().min(0).max(20).optional(),
  noseScore: z.number().int().min(0).max(20).optional(),
  palateScore: z.number().int().min(0).max(20).optional(),
  finishScore: z.number().int().min(0).max(20).optional(),
  balanceScore: z.number().int().min(0).max(20).optional(),
});

// Drink log schema
export const drinkLogCreateSchema = z.object({
  drankAt: z.string().optional(),
  context: z.string().optional(),
  venue: z.string().optional(),
  rating: z.number().int().min(0).max(100).optional(),
  tastingNotes: z.record(z.string()).optional(),
  notes: z.string().optional(),
});

// Tasting session summary update
export const tastingSessionSummarySchema = z.object({
  summary: z.string().optional(),
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

// Social tasting mode schemas
export const guestJoinSchema = z.object({
  sessionCode: z.string().min(1, 'Session code is required'),
  guestName: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
});

export const socialModeToggleSchema = z.object({
  enabled: z.boolean(),
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
export type GuestJoinInput = z.infer<typeof guestJoinSchema>;
export type SocialModeToggleInput = z.infer<typeof socialModeToggleSchema>;
