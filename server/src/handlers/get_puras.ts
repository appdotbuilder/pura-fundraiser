import { db } from '../db';
import { purasTable, donationsTable } from '../db/schema';
import { type Pura } from '../schema';
import { sql, sum, eq } from 'drizzle-orm';

export const getPuras = async (): Promise<Pura[]> => {
  try {
    // Get all puras with calculated current_amount from donations
    const result = await db
      .select({
        id: purasTable.id,
        name: purasTable.name,
        location: purasTable.location,
        description: purasTable.description,
        target_amount: purasTable.target_amount,
        current_amount: sql<string>`COALESCE(${sum(donationsTable.amount)}, 0)`.as('current_amount'),
        created_at: purasTable.created_at,
        updated_at: purasTable.updated_at
      })
      .from(purasTable)
      .leftJoin(donationsTable, eq(purasTable.id, donationsTable.pura_id))
      .groupBy(
        purasTable.id,
        purasTable.name,
        purasTable.location,
        purasTable.description,
        purasTable.target_amount,
        purasTable.created_at,
        purasTable.updated_at
      )
      .execute();

    // Convert numeric fields back to numbers
    return result.map(pura => ({
      ...pura,
      target_amount: parseFloat(pura.target_amount),
      current_amount: parseFloat(pura.current_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch puras:', error);
    throw error;
  }
};