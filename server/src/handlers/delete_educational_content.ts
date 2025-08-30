import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteEducationalContent(id: number): Promise<boolean> {
  try {
    // Delete the educational content by ID
    const result = await db.delete(educationalContentTable)
      .where(eq(educationalContentTable.id, id))
      .returning()
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.length > 0;
  } catch (error) {
    console.error('Educational content deletion failed:', error);
    throw error;
  }
}