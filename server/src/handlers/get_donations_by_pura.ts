import { db } from '../db';
import { donationsTable } from '../db/schema';
import { type Donation } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getDonationsByPura(puraId: number): Promise<Donation[]> {
  try {
    // Query donations for the specific pura, ordered by creation date (most recent first)
    const results = await db.select()
      .from(donationsTable)
      .where(eq(donationsTable.pura_id, puraId))
      .orderBy(desc(donationsTable.created_at))
      .execute();

    // Convert numeric amount fields back to numbers
    return results.map(donation => ({
      ...donation,
      amount: parseFloat(donation.amount) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch donations by pura:', error);
    throw error;
  }
}