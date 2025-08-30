import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define content category enum
export const contentCategoryEnum = pgEnum('content_category', [
  'history',
  'culture', 
  'traditions',
  'festivals',
  'architecture',
  'ceremonies',
  'philosophy',
  'general'
]);

// Pura table
export const purasTable = pgTable('puras', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  description: text('description').notNull(),
  target_amount: numeric('target_amount', { precision: 10, scale: 2 }).notNull(),
  current_amount: numeric('current_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Donations table
export const donationsTable = pgTable('donations', {
  id: serial('id').primaryKey(),
  pura_id: integer('pura_id').notNull().references(() => purasTable.id, { onDelete: 'cascade' }),
  donor_name: text('donor_name').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  message: text('message'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Educational content table
export const educationalContentTable = pgTable('educational_content', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: contentCategoryEnum('category').notNull(),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define relations
export const purasRelations = relations(purasTable, ({ many }) => ({
  donations: many(donationsTable),
}));

export const donationsRelations = relations(donationsTable, ({ one }) => ({
  pura: one(purasTable, {
    fields: [donationsTable.pura_id],
    references: [purasTable.id],
  }),
}));

// TypeScript types for database operations
export type Pura = typeof purasTable.$inferSelect;
export type NewPura = typeof purasTable.$inferInsert;
export type Donation = typeof donationsTable.$inferSelect;
export type NewDonation = typeof donationsTable.$inferInsert;
export type EducationalContent = typeof educationalContentTable.$inferSelect;
export type NewEducationalContent = typeof educationalContentTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  puras: purasTable,
  donations: donationsTable,
  educationalContent: educationalContentTable
};