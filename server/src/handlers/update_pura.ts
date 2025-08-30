import { db } from '../db';
import { purasTable } from '../db/schema';
import { type UpdatePuraInput, type Pura } from '../schema';
import { eq } from 'drizzle-orm';

export async function updatePura(input: UpdatePuraInput): Promise<Pura | null> {
  try {
    // Build the update object dynamically with only provided fields
    const updateData: Partial<typeof purasTable.$inferInsert> = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.location !== undefined) {
      updateData.location = input.location;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.target_amount !== undefined) {
      updateData.target_amount = input.target_amount.toString(); // Convert number to string for numeric column
    }

    // Update the pura record
    const result = await db.update(purasTable)
      .set(updateData)
      .where(eq(purasTable.id, input.id))
      .returning()
      .execute();

    // Return null if no record was updated (pura doesn't exist)
    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const pura = result[0];
    return {
      ...pura,
      target_amount: parseFloat(pura.target_amount),
      current_amount: parseFloat(pura.current_amount)
    };
  } catch (error) {
    console.error('Pura update failed:', error);
    throw error;
  }
}