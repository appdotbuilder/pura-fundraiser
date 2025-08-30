import { db } from '../db';
import { donationsTable, purasTable } from '../db/schema';
import { type CreateDonationInput, type Donation } from '../schema';
import { eq } from 'drizzle-orm';

export async function createDonation(input: CreateDonationInput): Promise<Donation> {
  try {
    // Verify the pura exists first to prevent foreign key constraint violations
    const existingPura = await db.select()
      .from(purasTable)
      .where(eq(purasTable.id, input.pura_id))
      .execute();

    if (existingPura.length === 0) {
      throw new Error(`Pura with id ${input.pura_id} not found`);
    }

    // Use a transaction to ensure both operations succeed or fail together
    const result = await db.transaction(async (tx) => {
      // Create the donation record
      const donationResult = await tx.insert(donationsTable)
        .values({
          pura_id: input.pura_id,
          donor_name: input.donor_name,
          amount: input.amount.toString(), // Convert number to string for numeric column
          message: input.message || null
        })
        .returning()
        .execute();

      // Update the pura's current_amount and updated_at timestamp
      const currentAmount = parseFloat(existingPura[0].current_amount);
      const newAmount = currentAmount + input.amount;
      
      await tx.update(purasTable)
        .set({
          current_amount: newAmount.toString(),
          updated_at: new Date()
        })
        .where(eq(purasTable.id, input.pura_id))
        .execute();

      return donationResult[0];
    });

    // Convert numeric fields back to numbers before returning
    return {
      ...result,
      amount: parseFloat(result.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Donation creation failed:', error);
    throw error;
  }
}