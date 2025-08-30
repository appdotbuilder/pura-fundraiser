import { db } from '../db';
import { educationalContentTable } from '../db/schema';
import { type UpdateEducationalContentInput, type EducationalContent } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateEducationalContent(input: UpdateEducationalContentInput): Promise<EducationalContent | null> {
  try {
    // First, check if the educational content exists
    const existingContent = await db.select()
      .from(educationalContentTable)
      .where(eq(educationalContentTable.id, input.id))
      .execute();

    if (existingContent.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.category !== undefined) {
      updateData.category = input.category;
    }

    if (input.content !== undefined) {
      updateData.content = input.content;
    }

    // Update the educational content
    const result = await db.update(educationalContentTable)
      .set(updateData)
      .where(eq(educationalContentTable.id, input.id))
      .returning()
      .execute();

    // Return the updated content
    const updatedContent = result[0];
    return {
      ...updatedContent,
      // No numeric conversions needed for educational content
    };
  } catch (error) {
    console.error('Educational content update failed:', error);
    throw error;
  }
}