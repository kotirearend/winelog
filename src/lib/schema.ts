import { pgTable, text, varchar, timestamp, uuid, integer, numeric, date, boolean, jsonb, char } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(() => randomUUID()),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  defaultCurrency: char('default_currency', { length: 3 }).default('GBP'),
  beverageType: varchar('beverage_type', { length: 10 }).default('wine').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Locations table (storage locations)
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().default(() => randomUUID()),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Bottles table
export const bottles = pgTable('bottles', {
  id: uuid('id').primaryKey().default(() => randomUUID()),
  userId: uuid('user_id').notNull().references(() => users.id),
  photoUrl: text('photo_url'),
  name: varchar('name', { length: 255 }).notNull(),
  producer: varchar('producer', { length: 255 }),
  vintage: integer('vintage'),
  grapes: jsonb('grapes').$type<string[]>(),
  country: varchar('country', { length: 255 }),
  region: varchar('region', { length: 255 }),
  // Status: in_cellar, consumed, archived
  status: varchar('status', { length: 20 }).default('in_cellar').notNull(),
  // Storage location
  locationId: uuid('location_id').references(() => locations.id),
  subLocationText: varchar('sub_location_text', { length: 255 }),
  // Purchase info
  purchaseDate: date('purchase_date'),
  purchaseSourceType: varchar('purchase_source_type', { length: 20 }),
  purchaseSourceName: varchar('purchase_source_name', { length: 255 }),
  priceAmount: numeric('price_amount', { precision: 10, scale: 2 }),
  priceCurrency: char('price_currency', { length: 3 }),
  quantity: integer('quantity').default(1).notNull(),
  // Notes
  notesShort: varchar('notes_short', { length: 500 }),
  notesLong: text('notes_long'),
  tags: jsonb('tags').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tasting sessions table
export const tastingSessions = pgTable('tasting_sessions', {
  id: uuid('id').primaryKey().default(() => randomUUID()),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  tastedAt: timestamp('tasted_at').defaultNow(),
  venue: varchar('venue', { length: 255 }),
  participants: text('participants'),
  notes: text('notes'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tasting entries table
export const tastingEntries = pgTable('tasting_entries', {
  id: uuid('id').primaryKey().default(() => randomUUID()),
  tastingSessionId: uuid('tasting_session_id').notNull().references(() => tastingSessions.id),
  bottleId: uuid('bottle_id').references(() => bottles.id),
  adHocName: varchar('ad_hoc_name', { length: 255 }),
  adHocPhotoUrl: text('ad_hoc_photo_url'),
  saveToCellar: boolean('save_to_cellar').default(false),
  appearanceScore: integer('appearance_score'),
  noseScore: integer('nose_score'),
  palateScore: integer('palate_score'),
  finishScore: integer('finish_score'),
  balanceScore: integer('balance_score'),
  totalScore: integer('total_score'),
  tastingNotes: jsonb('tasting_notes').$type<Record<string, unknown>>(),
  entryPhotoUrl: text('entry_photo_url'),
  notesShort: varchar('notes_short', { length: 500 }),
  notesLong: text('notes_long'),
  tags: jsonb('tags').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Drink log table - when you drink/taste a specific bottle
export const drinkLogs = pgTable('drink_logs', {
  id: uuid('id').primaryKey().default(() => randomUUID()),
  userId: uuid('user_id').notNull().references(() => users.id),
  bottleId: uuid('bottle_id').notNull().references(() => bottles.id),
  drankAt: timestamp('drank_at').defaultNow(),
  context: varchar('context', { length: 255 }),
  venue: varchar('venue', { length: 255 }),
  rating: integer('rating'),
  tastingNotes: jsonb('tasting_notes').$type<Record<string, unknown>>(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  locations: many(locations),
  bottles: many(bottles),
  tastingSessions: many(tastingSessions),
  drinkLogs: many(drinkLogs),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
  bottles: many(bottles),
}));

export const bottlesRelations = relations(bottles, ({ one, many }) => ({
  user: one(users, {
    fields: [bottles.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [bottles.locationId],
    references: [locations.id],
  }),
  tastingEntries: many(tastingEntries),
  drinkLogs: many(drinkLogs),
}));

export const tastingSessionsRelations = relations(tastingSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [tastingSessions.userId],
    references: [users.id],
  }),
  tastingEntries: many(tastingEntries),
}));

export const tastingEntriesRelations = relations(tastingEntries, ({ one }) => ({
  tastingSession: one(tastingSessions, {
    fields: [tastingEntries.tastingSessionId],
    references: [tastingSessions.id],
  }),
  bottle: one(bottles, {
    fields: [tastingEntries.bottleId],
    references: [bottles.id],
  }),
}));

export const drinkLogsRelations = relations(drinkLogs, ({ one }) => ({
  user: one(users, {
    fields: [drinkLogs.userId],
    references: [users.id],
  }),
  bottle: one(bottles, {
    fields: [drinkLogs.bottleId],
    references: [bottles.id],
  }),
}));
