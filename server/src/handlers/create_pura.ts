import { db } from '../db';
import { purasTable } from '../db/schema';
import { type CreatePuraInput, type Pura } from '../schema';

export async function createPura(input: CreatePuraInput): Promise<Pura> {
  try {
    // Insert pura record
    const result = await db.insert(purasTable)
      .values({
        name: input.name,
        location: input.location,
        description: input.description,
        target_amount: input.target_amount.toString(), // Convert number to string for numeric column
        current_amount: '0' // Initialize to 0 as string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const pura = result[0];
    return {
      ...pura,
      target_amount: parseFloat(pura.target_amount), // Convert string back to number
      current_amount: parseFloat(pura.current_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Pura creation failed:', error);
    throw error;
  }
}