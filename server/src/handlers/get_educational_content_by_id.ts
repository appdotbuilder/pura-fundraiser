import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type EducationalContent } from '../schema';

export const getEducationalContentById = async (id: number): Promise<EducationalContent | null> => {
  try {
    // Query educational content by ID
    const results = await db.select()
      .from(educationalContentTable)
      .where(eq(educationalContentTable.id, id))
      .execute();

    // Return null if no content found
    if (results.length === 0) {
      return null;
    }

    // Return the first result (ID is unique)
    return results[0];
  } catch (error) {
    console.error('Get educational content by ID failed:', error);
    throw error;
  }
};