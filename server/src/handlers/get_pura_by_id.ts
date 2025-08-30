import { db } from '../db';
import { purasTable, donationsTable } from '../db/schema';
import { type PuraWithDonations } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPuraById(id: number): Promise<PuraWithDonations | null> {
  try {
    // Get the pura with its donations using a join
    const results = await db.select()
      .from(purasTable)
      .leftJoin(donationsTable, eq(donationsTable.pura_id, purasTable.id))
      .where(eq(purasTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Extract pura data from first result
    const puraData = results[0].puras;
    
    // Convert numeric fields to numbers and build donations array
    const donations = results
      .filter(result => result.donations !== null)
      .map(result => ({
        ...result.donations!,
        amount: parseFloat(result.donations!.amount)
      }));

    // Return the complete pura with donations
    return {
      ...puraData,
      target_amount: parseFloat(puraData.target_amount),
      current_amount: parseFloat(puraData.current_amount),
      donations
    };
  } catch (error) {
    console.error('Failed to get pura by id:', error);
    throw error;
  }
}