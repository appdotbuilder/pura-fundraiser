import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type EducationalContent, type ContentCategory } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getEducationalContent(category?: ContentCategory): Promise<EducationalContent[]> {
  try {
    // Build query with conditional where clause
    const baseQuery = db.select().from(educationalContentTable);
    
    const query = category
      ? baseQuery.where(eq(educationalContentTable.category, category)).orderBy(desc(educationalContentTable.created_at))
      : baseQuery.orderBy(desc(educationalContentTable.created_at));

    const results = await query.execute();

    // Return results with proper type mapping
    return results.map(content => ({
      ...content,
      // No numeric conversions needed - all fields are already properly typed
    }));
  } catch (error) {
    console.error('Failed to fetch educational content:', error);
    throw error;
  }
}